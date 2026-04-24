import { extractBatchRecipients } from "@/lib/batch-processing";
import {
  hasSendGridEnv,
  SENDGRID_CONFIG_ERROR,
  sendSendGridEmail,
} from "@/lib/email/sendgrid";
import {
  createAdminClient,
  hasSupabaseAdminEnv,
  SUPABASE_ADMIN_CONFIG_ERROR,
} from "@/lib/supabase/admin";
import {
  createClient,
  hasSupabaseServerEnv,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

type SendCertificateEmailsRequest = {
  batch_id?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: SendCertificateEmailsRequest;

  try {
    body = (await request.json()) as SendCertificateEmailsRequest;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const batchId = body.batch_id?.trim();
  if (!batchId) {
    return Response.json(
      { error: "Missing required field: batch_id." },
      { status: 400 }
    );
  }

  if (!hasSupabaseServerEnv()) {
    return Response.json({ error: SUPABASE_CONFIG_ERROR }, { status: 500 });
  }
  if (!hasSupabaseAdminEnv()) {
    return Response.json({ error: SUPABASE_ADMIN_CONFIG_ERROR }, { status: 500 });
  }
  if (!hasSendGridEnv()) {
    return Response.json({ error: SENDGRID_CONFIG_ERROR }, { status: 500 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return Response.json(
      { error: `Unable to verify the current user: ${authError.message}` },
      { status: 401 }
    );
  }

  if (!user) {
    return Response.json(
      { error: "Authentication required to send certificate emails." },
      { status: 401 }
    );
  }

  const batchJob = await findBatchJob(admin, batchId);
  if (!batchJob) {
    return Response.json({ error: "Batch not found." }, { status: 404 });
  }

  const batchUploadId = pickString(batchJob, ["batch_upload_id"]);
  const storageBucket = pickString(batchJob, ["storage_bucket"]);

  const batchUploadResult = await admin
    .from("batch_uploads")
    .select("*")
    .eq("id", batchUploadId)
    .maybeSingle();

  if (batchUploadResult.error) {
    return Response.json(
      { error: `Unable to load batch upload: ${batchUploadResult.error.message}` },
      { status: 500 }
    );
  }

  const batchUpload = asRecord(batchUploadResult.data);
  if (!batchUpload) {
    return Response.json({ error: "Batch upload not found." }, { status: 404 });
  }

  if (pickString(batchUpload, ["user_id"]) !== user.id) {
    return Response.json(
      { error: "You do not have permission to email this batch." },
      { status: 403 }
    );
  }

  const ownerResult = await admin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (ownerResult.error) {
    return Response.json(
      { error: `Unable to load sender profile: ${ownerResult.error.message}` },
      { status: 500 }
    );
  }

  const owner = asRecord(ownerResult.data);
  const organization =
    pickString(owner, ["organization_name", "company_name", "full_name"]) ||
    "CertiDraft";
  const recipients = extractBatchRecipients(batchUpload as JsonRecord);

  const certificatesResult = await admin
    .from("certificates")
    .select("*")
    .eq("batch_upload_id", batchUploadId)
    .eq("status", "completed");

  if (certificatesResult.error) {
    return Response.json(
      {
        error: `Unable to load certificates for email sending: ${certificatesResult.error.message}`,
      },
      { status: 500 }
    );
  }

  const certificates = (certificatesResult.data ?? [])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is JsonRecord => Boolean(entry));

  const results: Array<{
    certificate_id: string;
    recipient_name: string;
    recipient_email: string;
    status: "sent" | "failed";
    error?: string;
  }> = [];

  for (const certificate of certificates) {
    const recipientEmail = resolveRecipientEmail(certificate, recipients);
    const certificateId = pickString(certificate, ["id"]);
    const recipientName =
      pickString(certificate, ["recipient_name"]) || "Certificate recipient";

    if (!recipientEmail) {
      const error = "Recipient email not found in batch upload data.";
      results.push({
        certificate_id: certificateId,
        recipient_name: recipientName,
        recipient_email: "",
        status: "failed",
        error,
      });
      await insertEmailLog(admin, {
        batchJobId: pickString(batchJob, ["id"]),
        batchUploadId,
        certificateId,
        recipientEmail: "",
        subject: `${organization} - Your Certificate is Ready!`,
        status: "failed",
        errorMessage: error,
      });
      continue;
    }

    try {
      const storagePath = pickString(certificate, ["storage_path"]);
      const verificationToken = pickString(certificate, ["verification_token"]);
      const verificationUrl =
        pickString(certificate, ["verification_url"]) ||
        buildVerificationUrl(verificationToken);
      const signedDownloadUrl = storagePath
        ? await createSignedDownloadUrl(admin, storageBucket, storagePath)
        : "";
      const attachmentBase64 = storagePath
        ? await downloadCertificateAsBase64(admin, storageBucket, storagePath)
        : "";
      const achievement =
        pickString(certificate, ["achievement", "citation_text", "title"]) ||
        "Certificate issued";
      const issueDate =
        pickString(certificate, ["issued_at", "generated_at", "created_at"]) ||
        new Date().toISOString();
      const subject = `${organization} - Your Certificate is Ready!`;

      await sendSendGridEmail({
        to: recipientEmail,
        subject,
        html: buildEmailHtml({
          recipientName,
          organization,
          achievement,
          issueDate,
          verificationUrl,
          signedDownloadUrl,
        }),
        text: buildEmailText({
          recipientName,
          organization,
          achievement,
          issueDate,
          verificationUrl,
          signedDownloadUrl,
        }),
        attachmentFilename: buildAttachmentFilename(recipientName),
        attachmentBase64,
      });

      results.push({
        certificate_id: certificateId,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        status: "sent",
      });

      await insertEmailLog(admin, {
        batchJobId: pickString(batchJob, ["id"]),
        batchUploadId,
        certificateId,
        recipientEmail,
        subject,
        status: "sent",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send certificate email.";
      results.push({
        certificate_id: certificateId,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        status: "failed",
        error: message,
      });
      await insertEmailLog(admin, {
        batchJobId: pickString(batchJob, ["id"]),
        batchUploadId,
        certificateId,
        recipientEmail,
        subject: `${organization} - Your Certificate is Ready!`,
        status: "failed",
        errorMessage: message,
      });
    }
  }

  return Response.json({
    batch_id: batchId,
    sent: results.filter((entry) => entry.status === "sent").length,
    failed: results.filter((entry) => entry.status === "failed").length,
    results,
  });
}

async function findBatchJob(
  admin: ReturnType<typeof createAdminClient>,
  batchId: string
) {
  const byIdResult = await admin
    .from("batch_jobs")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();

  if (byIdResult.error) {
    throw new Error(`Unable to load batch job: ${byIdResult.error.message}`);
  }

  if (byIdResult.data) {
    return asRecord(byIdResult.data);
  }

  const byUploadIdResult = await admin
    .from("batch_jobs")
    .select("*")
    .eq("batch_upload_id", batchId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byUploadIdResult.error) {
    throw new Error(
      `Unable to load batch job by upload id: ${byUploadIdResult.error.message}`
    );
  }

  return asRecord(byUploadIdResult.data);
}

function resolveRecipientEmail(
  certificate: JsonRecord,
  recipients: ReturnType<typeof extractBatchRecipients>
) {
  const recipientIndex = pickNumber(certificate, ["recipient_index"]);
  const recipientName = pickString(certificate, ["recipient_name"]);

  const matchedRecipient =
    recipients.find((recipient) => recipient.index === recipientIndex) ||
    recipients.find((recipient) => recipient.name === recipientName) ||
    null;

  if (!matchedRecipient) {
    return "";
  }

  return pickString(matchedRecipient.raw, [
    "email",
    "Email",
    "email_address",
    "emailAddress",
    "recipient_email",
    "recipientEmail",
  ]);
}

async function createSignedDownloadUrl(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string
) {
  const signedUrlResult = await admin.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  if (signedUrlResult.error || !signedUrlResult.data.signedUrl) {
    throw new Error(
      signedUrlResult.error?.message || "Unable to create certificate download link."
    );
  }

  return signedUrlResult.data.signedUrl;
}

async function downloadCertificateAsBase64(
  admin: ReturnType<typeof createAdminClient>,
  bucket: string,
  path: string
) {
  const downloadResult = await admin.storage.from(bucket).download(path);

  if (downloadResult.error || !downloadResult.data) {
    throw new Error(
      downloadResult.error?.message || "Unable to download the certificate attachment."
    );
  }

  const fileBuffer = Buffer.from(await downloadResult.data.arrayBuffer());
  return fileBuffer.toString("base64");
}

async function insertEmailLog(
  admin: ReturnType<typeof createAdminClient>,
  input: {
    batchJobId: string;
    batchUploadId: string;
    certificateId: string;
    recipientEmail: string;
    subject: string;
    status: "sent" | "failed";
    errorMessage?: string;
  }
) {
  const now = new Date().toISOString();
  const result = await admin.from("email_logs").insert({
    batch_job_id: input.batchJobId,
    batch_upload_id: input.batchUploadId,
    certificate_id: input.certificateId,
    recipient_email: input.recipientEmail || null,
    provider: "sendgrid",
    subject: input.subject,
    status: input.status,
    error_message: input.errorMessage || null,
    sent_at: input.status === "sent" ? now : null,
    created_at: now,
    updated_at: now,
  });

  if (result.error) {
    console.error("Unable to insert email log:", result.error.message);
  }
}

function buildEmailHtml(input: {
  recipientName: string;
  organization: string;
  achievement: string;
  issueDate: string;
  verificationUrl: string;
  signedDownloadUrl: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Your Certificate is Ready</h2>
      <p>Hello ${escapeHtml(input.recipientName)},</p>
      <p>Your certificate from <strong>${escapeHtml(
        input.organization
      )}</strong> is now ready.</p>
      <p><strong>Achievement:</strong> ${escapeHtml(input.achievement)}<br />
      <strong>Issue date:</strong> ${escapeHtml(formatDate(input.issueDate))}</p>
      <p>
        <a href="${escapeHtml(
          input.signedDownloadUrl
        )}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px;">
          Download Certificate
        </a>
      </p>
      <p>
        Verification link:<br />
        <a href="${escapeHtml(input.verificationUrl)}">${escapeHtml(
    input.verificationUrl
  )}</a>
      </p>
      <p>We have also attached the PDF certificate to this email for convenience.</p>
    </div>
  `;
}

function buildEmailText(input: {
  recipientName: string;
  organization: string;
  achievement: string;
  issueDate: string;
  verificationUrl: string;
  signedDownloadUrl: string;
}) {
  return [
    `Hello ${input.recipientName},`,
    "",
    `Your certificate from ${input.organization} is now ready.`,
    `Achievement: ${input.achievement}`,
    `Issue date: ${formatDate(input.issueDate)}`,
    "",
    `Download: ${input.signedDownloadUrl}`,
    `Verify: ${input.verificationUrl}`,
  ].join("\n");
}

function buildAttachmentFilename(recipientName: string) {
  const slug = recipientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "certificate"}.pdf`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(parsed);
}

function buildVerificationUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://certidraft.com";
  return `${siteUrl.replace(/\/+$/, "")}/verify/${encodeURIComponent(token)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
}

function pickString(record: JsonRecord | null, keys: string[]) {
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function pickNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return -1;
}
