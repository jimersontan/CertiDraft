import { Job } from "bullmq";

import { generateCertificatePDF } from "@/lib/certificates/pdf-generator";
import {
  buildVerificationUrl,
  generateVerificationQrCodeDataUrl,
  generateVerificationToken,
} from "@/lib/certificates/qr-code";
import { CertificateGenerationJobData } from "@/lib/queue/certificate-generation";
import { createAdminClient } from "@/lib/supabase/admin";
import { fallbackTemplates, mapTemplateRow, type TemplateRecord } from "@/lib/templates";

type JsonRecord = Record<string, unknown>;

type BatchUploadRow = JsonRecord & {
  id?: string;
  user_id?: string;
  template_id?: string;
  design_snapshot?: string | null;
};

type CitationRow = {
  recipient_index?: number | null;
  recipient_name?: string | null;
  name?: string | null;
  achievement?: string | null;
  citation_text?: string | null;
  citation?: string | null;
};

export type BatchRecipient = {
  index: number;
  raw: JsonRecord;
  name: string;
  achievement: string;
  date: string;
  grade: string;
};

type CertificateRenderData = {
  template: TemplateRecord;
  recipient: BatchRecipient;
  citation: string;
  issuedDate: string;
  grade: string;
  verificationToken: string;
  verificationUrl: string;
  qrCodeDataUrl: string;
  designSnapshot?: string | null;
};

export async function processCertificateGenerationJob(
  job: Job<CertificateGenerationJobData>
) {
  const supabase = createAdminClient();
  const bucket =
    job.data.bucket ||
    process.env.SUPABASE_CERTIFICATES_BUCKET ||
    "certificates";

  const { data: batchJob, error: batchJobError } = await supabase
    .from("batch_jobs")
    .select("*")
    .eq("id", job.data.batchJobId)
    .single();

  if (batchJobError || !batchJob) {
    throw new Error(batchJobError?.message || "Batch job not found.");
  }

  try {
    const { data: batchUpload, error: batchUploadError } = await supabase
      .from("batch_uploads")
      .select("*")
      .eq("id", job.data.batchUploadId)
      .single();

    if (batchUploadError || !batchUpload) {
      throw new Error(
        batchUploadError?.message || "Batch upload not found for this job."
      );
    }

    const recipients = extractBatchRecipients(batchUpload as BatchUploadRow);
    if (recipients.length === 0) {
      throw new Error(
        "No recipients were found on the batch upload. Expected rows in recipients, rows, parsed_rows, recipient_rows, data, or payload."
      );
    }

    const template = await resolveTemplate(
      supabase,
      job.data.templateId ||
        readString(batchJob, "template_id") ||
        readString(batchUpload as JsonRecord, "template_id")
    );

    const designSnapshot =
      job.data.designSnapshot ||
      readString(batchJob, "design_snapshot") ||
      readString(batchUpload as JsonRecord, "design_snapshot");

    const { data: citations, error: citationsError } = await supabase
      .from("citations")
      .select("*")
      .eq("batch_upload_id", job.data.batchUploadId);

    if (citationsError) {
      throw new Error(`Unable to read citations: ${citationsError.message}`);
    }

    let processedCount = 0;
    const errors: string[] = [];

    await updateBatchJob(supabase, job.data.batchJobId, {
      status: "processing",
      processed_count: 0,
      total_count: recipients.length,
      errors,
      started_at: new Date().toISOString(),
      storage_bucket: bucket,
      updated_at: new Date().toISOString(),
    });

    for (const recipient of recipients) {
      let verificationToken = "";
      let verificationUrl = "";
      const citation = findCitationText((citations ?? []) as CitationRow[], recipient);

      try {
        verificationToken = generateVerificationToken();
        verificationUrl = buildVerificationUrl(verificationToken);
        const qrCodeDataUrl = await generateVerificationQrCodeDataUrl(
          verificationToken
        );
        const renderData: CertificateRenderData = {
          template,
          recipient,
          citation,
          issuedDate: recipient.date,
          grade: recipient.grade,
          verificationToken,
          verificationUrl,
          qrCodeDataUrl,
          designSnapshot,
        };
        const pdfBuffer = await generateCertificatePDF(
          buildCertificateDesign(renderData),
          buildCertificateRecipientData(renderData)
        );
        const filePath = buildStoragePath(job.data.batchUploadId, recipient);

        const uploadResult = await supabase.storage
          .from(bucket)
          .upload(filePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadResult.error) {
          throw new Error(
            `Unable to upload PDF to Supabase Storage: ${uploadResult.error.message}`
          );
        }

        await persistCertificateRecord(supabase, {
          batchJobId: job.data.batchJobId,
          batchUploadId: job.data.batchUploadId,
          template,
          recipient,
          citation,
          issuedDate: renderData.issuedDate,
          grade: renderData.grade,
          storageBucket: bucket,
          storagePath: filePath,
          verificationToken,
          verificationUrl,
          status: "completed",
          generatedAt: new Date().toISOString(),
        });

        processedCount += 1;
        await job.updateProgress(
          Math.round((processedCount / recipients.length) * 100)
        );
        await updateBatchJob(supabase, job.data.batchJobId, {
          status: "processing",
          processed_count: processedCount,
          total_count: recipients.length,
          errors,
          updated_at: new Date().toISOString(),
        });
      } catch (error) {
        let errorMessage = getErrorMessage(
          error,
          "Unable to generate this certificate."
        );

        if (verificationToken) {
          try {
            await persistCertificateRecord(supabase, {
              batchJobId: job.data.batchJobId,
              batchUploadId: job.data.batchUploadId,
              template,
              recipient,
              citation,
              issuedDate: recipient.date,
              grade: recipient.grade,
              storageBucket: bucket,
              storagePath: null,
              verificationToken,
              verificationUrl,
              status: "failed",
              errorMessage,
            });
          } catch (persistError) {
            errorMessage = getErrorMessage(
              persistError,
              "Unable to save certificate metadata."
            );
          }
        }

        errors.push(`${recipient.name}: ${errorMessage}`);
        await updateBatchJob(supabase, job.data.batchJobId, {
          status: "processing",
          processed_count: processedCount,
          total_count: recipients.length,
          errors,
          updated_at: new Date().toISOString(),
        });
      }
    }

    await updateBatchJob(supabase, job.data.batchJobId, {
      status: errors.length > 0 ? "completed_with_errors" : "completed",
      processed_count: processedCount,
      total_count: recipients.length,
      errors,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      processedCount,
      totalCount: recipients.length,
      errors,
    };
  } catch (error) {
    const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);

    await updateBatchJob(supabase, job.data.batchJobId, {
      status: finalAttempt ? "failed" : "retrying",
      errors: [
        getErrorMessage(error, "Certificate batch processing failed."),
      ],
      updated_at: new Date().toISOString(),
      ...(finalAttempt ? { completed_at: new Date().toISOString() } : {}),
    });

    throw error;
  }
}

export function extractBatchRecipients(batchUpload: BatchUploadRow) {
  const sources = [
    batchUpload.recipients,
    batchUpload.rows,
    batchUpload.parsed_rows,
    batchUpload.recipient_rows,
    batchUpload.data,
    batchUpload.payload,
  ];

  const rawRecipients =
    sources
      .map((source) => extractArray(source))
      .find((value) => value.length > 0) ?? [];

  return rawRecipients
    .map((item, index) => normalizeRecipient(item, index))
    .filter((recipient): recipient is BatchRecipient => recipient !== null);
}

function extractArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = asRecord(value);
  if (!record) {
    return [];
  }

  for (const key of [
    "recipients",
    "rows",
    "parsed_rows",
    "recipient_rows",
    "data",
    "items",
  ]) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  return [];
}

function normalizeRecipient(item: unknown, index: number): BatchRecipient | null {
  const raw = asRecord(item);
  if (!raw) {
    return null;
  }

  const name = pickString(raw, [
    "name",
    "Name",
    "full_name",
    "fullName",
    "recipient_name",
    "recipientName",
  ]);
  const achievement = pickString(raw, [
    "achievement",
    "Achievement",
    "award",
    "Award",
    "course",
    "Course",
    "result",
    "Result",
    "title",
    "Title",
  ]);

  if (!name || !achievement) {
    return null;
  }

  return {
    index,
    raw,
    name,
    achievement,
    date: pickString(raw, ["date", "Date", "issued_at", "issuedOn"]),
    grade: pickString(raw, ["grade", "Grade", "score", "Score"]),
  };
}

function findCitationText(citations: CitationRow[], recipient: BatchRecipient) {
  const existing = citations.find((citation) => {
    if (typeof citation.recipient_index === "number") {
      return citation.recipient_index === recipient.index;
    }

    const citationName = (citation.recipient_name || citation.name || "")
      .trim()
      .toLowerCase();
    const citationAchievement = (citation.achievement || "")
      .trim()
      .toLowerCase();

    return (
      citationName === recipient.name.toLowerCase() &&
      citationAchievement === recipient.achievement.toLowerCase()
    );
  });

  return (
    existing?.citation_text ||
    existing?.citation ||
    `In recognition of ${recipient.achievement}.`
  );
}

async function resolveTemplate(
  supabase: ReturnType<typeof createAdminClient>,
  templateId?: string
) {
  if (templateId) {
    const fallback =
      fallbackTemplates.find((template) => template.id === templateId) ||
      fallbackTemplates[0];

    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();

      if (!error && data) {
        return mapTemplateRow(data);
      }
    } catch {
      return fallback;
    }

    return fallback;
  }

  return fallbackTemplates[0];
}

function buildCertificateDesign(data: CertificateRenderData) {
  return {
    title: data.template.featuredText,
    primaryColor: data.template.primaryColor,
    secondaryColor: data.template.secondaryColor,
    designSnapshot: data.designSnapshot,
  };
}

function buildCertificateRecipientData(data: CertificateRenderData) {
  return {
    ...data.recipient.raw,
    name: data.recipient.name,
    achievement: data.recipient.achievement,
    citation: data.citation,
    issuedDate: data.issuedDate || new Date().toLocaleDateString("en-US"),
    grade: data.grade,
    verificationToken: data.verificationToken,
    verificationUrl: data.verificationUrl,
    qrCodeDataUrl: data.qrCodeDataUrl,
  };
}

function buildStoragePath(batchUploadId: string, recipient: BatchRecipient) {
  return `${batchUploadId}/${String(recipient.index).padStart(4, "0")}-${slugify(
    recipient.name
  )}.pdf`;
}

async function updateBatchJob(
  supabase: ReturnType<typeof createAdminClient>,
  batchJobId: string,
  payload: JsonRecord
) {
  const result = await supabase
    .from("batch_jobs")
    .update(payload)
    .eq("id", batchJobId);

  if (result.error) {
    throw new Error(
      `Unable to update batch job state. Expected \`batch_jobs\` to support status, processed_count, total_count, errors, started_at, completed_at, storage_bucket, and updated_at. Supabase error: ${result.error.message}`
    );
  }
}

function readString(record: JsonRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function pickString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function asRecord(value: unknown): JsonRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function persistCertificateRecord(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    batchJobId: string;
    batchUploadId: string;
    template: TemplateRecord;
    recipient: BatchRecipient;
    citation: string;
    issuedDate: string;
    grade: string;
    storageBucket: string;
    storagePath: string | null;
    verificationToken: string;
    verificationUrl: string;
    status: "completed" | "failed";
    generatedAt?: string;
    errorMessage?: string;
  }
) {
  const existingCertificateResult = await supabase
    .from("certificates")
    .select("id")
    .eq("batch_upload_id", payload.batchUploadId)
    .eq("recipient_index", payload.recipient.index)
    .maybeSingle();

  if (existingCertificateResult.error) {
    throw new Error(
      `Unable to look up certificate row. Expected \`certificates\` to support at least batch_upload_id and recipient_index. Supabase error: ${existingCertificateResult.error.message}`
    );
  }

  const now = new Date().toISOString();
  const certificatePayload = {
    batch_job_id: payload.batchJobId,
    batch_upload_id: payload.batchUploadId,
    recipient_index: payload.recipient.index,
    recipient_name: payload.recipient.name,
    achievement: payload.recipient.achievement,
    citation_text: payload.citation,
    template_id: payload.template.id,
    template_name: payload.template.name,
    verification_token: payload.verificationToken,
    verification_url: payload.verificationUrl,
    storage_bucket: payload.storageBucket,
    storage_path: payload.storagePath,
    issued_at: payload.issuedDate || null,
    grade: payload.grade || null,
    status: payload.status,
    error_message: payload.errorMessage || null,
    generated_at: payload.generatedAt || null,
    updated_at: now,
  };

  const result = existingCertificateResult.data?.id
    ? await supabase
        .from("certificates")
        .update(certificatePayload)
        .eq("id", existingCertificateResult.data.id)
    : await supabase.from("certificates").insert({
        ...certificatePayload,
        created_at: now,
      });

  if (result.error) {
    throw new Error(
      `Unable to save certificate row. Expected \`certificates\` to support batch_job_id, batch_upload_id, recipient_index, recipient_name, achievement, citation_text, template_id, template_name, verification_token, verification_url, storage_bucket, storage_path, issued_at, grade, status, error_message, generated_at, created_at, and updated_at. Supabase error: ${result.error.message}`
    );
  }
}
