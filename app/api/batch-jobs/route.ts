import { getCertificateGenerationQueue } from "@/lib/queue/certificate-generation";
import { hasRedisEnv, REDIS_CONFIG_ERROR } from "@/lib/queue/redis";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import {
  createAdminClient,
  hasSupabaseAdminEnv,
  SUPABASE_ADMIN_CONFIG_ERROR,
} from "@/lib/supabase/admin";
import { extractBatchRecipients } from "@/lib/batch-processing";

type CreateBatchJobRequest = {
  batch_upload_id?: string;
  template_id?: string;
  design_snapshot?: string | null;
  bucket?: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: CreateBatchJobRequest;

  try {
    body = (await request.json()) as CreateBatchJobRequest;
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const batchUploadId = body.batch_upload_id?.trim();
  if (!batchUploadId) {
    return Response.json(
      { error: "Missing required field: batch_upload_id." },
      { status: 400 }
    );
  }

  if (!hasSupabaseServerEnv()) {
    return Response.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 }
    );
  }

  if (!hasSupabaseAdminEnv()) {
    return Response.json({ error: SUPABASE_ADMIN_CONFIG_ERROR }, { status: 500 });
  }

  if (!hasRedisEnv()) {
    return Response.json({ error: REDIS_CONFIG_ERROR }, { status: 500 });
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
      { error: "Authentication required to create a batch job." },
      { status: 401 }
    );
  }

  const { data: batchUpload, error: batchUploadError } = await supabase
    .from("batch_uploads")
    .select("*")
    .eq("id", batchUploadId)
    .single();

  if (batchUploadError || !batchUpload) {
    return Response.json(
      { error: batchUploadError?.message || "Batch upload not found." },
      { status: 404 }
    );
  }

  if (
    typeof batchUpload.user_id === "string" &&
    batchUpload.user_id !== user.id
  ) {
    return Response.json(
      { error: "You do not have permission to process this batch upload." },
      { status: 403 }
    );
  }

  const recipients = extractBatchRecipients(batchUpload);
  if (recipients.length === 0) {
    return Response.json(
      {
        error:
          "No recipients were found on the batch upload. Expected rows in recipients, rows, parsed_rows, recipient_rows, data, or payload.",
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const insertPayload = {
    batch_upload_id: batchUploadId,
    template_id:
      body.template_id?.trim() ||
      (typeof batchUpload.template_id === "string" ? batchUpload.template_id : null),
    design_snapshot:
      body.design_snapshot ??
      (typeof batchUpload.design_snapshot === "string"
        ? batchUpload.design_snapshot
        : null),
    storage_bucket:
      body.bucket?.trim() ||
      process.env.SUPABASE_CERTIFICATES_BUCKET ||
      "certificates",
    status: "queued",
    processed_count: 0,
    total_count: recipients.length,
    errors: [],
    created_at: now,
    updated_at: now,
  };

  const { data: batchJob, error: insertError } = await admin
    .from("batch_jobs")
    .insert(insertPayload)
    .select("*")
    .single();

  if (insertError || !batchJob) {
    return Response.json(
      {
        error:
          insertError?.message ||
          "Unable to create batch job. Ensure batch_jobs supports batch_upload_id, template_id, design_snapshot, storage_bucket, status, processed_count, total_count, errors, created_at, and updated_at.",
      },
      { status: 500 }
    );
  }

  const queue = getCertificateGenerationQueue();
  const queueJob = await queue.add("generate-certificates", {
    batchJobId: String(batchJob.id),
    batchUploadId,
    templateId: insertPayload.template_id,
    bucket: insertPayload.storage_bucket,
    designSnapshot: insertPayload.design_snapshot,
    userId: user.id,
  });

  const { error: queueUpdateError } = await admin
    .from("batch_jobs")
    .update({
      queue_job_id: queueJob.id?.toString() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", batchJob.id);

  if (queueUpdateError) {
    return Response.json(
      {
        error:
          `The queue job was created, but batch_jobs.queue_job_id could not be saved: ${queueUpdateError.message}`,
      },
      { status: 500 }
    );
  }

  return Response.json(
    {
      batch_job_id: batchJob.id,
      queue_job_id: queueJob.id,
      status: "queued",
      processed_count: 0,
      total_count: recipients.length,
      errors: [],
    },
    { status: 202 }
  );
}
