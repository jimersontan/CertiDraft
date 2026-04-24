"use server";

import { revalidatePath } from "next/cache";

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

export async function deleteBatchAction(formData: FormData) {
  if (!hasSupabaseServerEnv()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  const batchJobId = String(formData.get("batch_job_id") ?? "").trim();
  if (!batchJobId) {
    throw new Error("Missing batch job id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to manage batches.");
  }

  const admin = createAdminClient();
  const batchJobResult = await admin
    .from("batch_jobs")
    .select("*")
    .eq("id", batchJobId)
    .maybeSingle();

  if (batchJobResult.error) {
    throw new Error(`Unable to load batch job: ${batchJobResult.error.message}`);
  }

  const batchJob = asRecord(batchJobResult.data);
  if (!batchJob) {
    throw new Error("Batch job not found.");
  }

  const batchUploadId = pickString(batchJob, ["batch_upload_id"]);
  if (!batchUploadId) {
    throw new Error("Batch upload reference missing.");
  }

  const batchUploadResult = await admin
    .from("batch_uploads")
    .select("*")
    .eq("id", batchUploadId)
    .maybeSingle();

  if (batchUploadResult.error) {
    throw new Error(
      `Unable to load batch upload: ${batchUploadResult.error.message}`
    );
  }

  const batchUpload = asRecord(batchUploadResult.data);
  if (!batchUpload || pickString(batchUpload, ["user_id"]) !== user.id) {
    throw new Error("You do not have access to this batch.");
  }

  const certificatesResult = await admin
    .from("certificates")
    .select("storage_path")
    .eq("batch_upload_id", batchUploadId);

  if (certificatesResult.error) {
    throw new Error(
      `Unable to load certificate files: ${certificatesResult.error.message}`
    );
  }

  const storageBucket = pickString(batchJob, ["storage_bucket"]);
  const storagePaths = (certificatesResult.data ?? [])
    .map((row) => asRecord(row))
    .filter((row): row is JsonRecord => Boolean(row))
    .map((row) => pickString(row, ["storage_path"]))
    .filter(Boolean);

  if (storageBucket && storagePaths.length > 0) {
    const removeResult = await admin.storage
      .from(storageBucket)
      .remove(storagePaths);

    if (removeResult.error) {
      throw new Error(
        `Unable to delete stored certificate files: ${removeResult.error.message}`
      );
    }
  }

  const deleteCertificatesResult = await admin
    .from("certificates")
    .delete()
    .eq("batch_upload_id", batchUploadId);

  if (deleteCertificatesResult.error) {
    throw new Error(
      `Unable to delete certificate records: ${deleteCertificatesResult.error.message}`
    );
  }

  const deleteBatchJobResult = await admin
    .from("batch_jobs")
    .delete()
    .eq("id", batchJobId);

  if (deleteBatchJobResult.error) {
    throw new Error(
      `Unable to delete batch job: ${deleteBatchJobResult.error.message}`
    );
  }

  revalidatePath("/dashboard");
}

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
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
