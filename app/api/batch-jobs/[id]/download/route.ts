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

type DownloadRouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: DownloadRouteContext
) {
  if (!hasSupabaseServerEnv()) {
    return new Response(SUPABASE_CONFIG_ERROR, { status: 500 });
  }
  if (!hasSupabaseAdminEnv()) {
    return new Response(SUPABASE_ADMIN_CONFIG_ERROR, { status: 500 });
  }

  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const batchJobResult = await admin
    .from("batch_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (batchJobResult.error) {
    return new Response(batchJobResult.error.message, { status: 500 });
  }

  const batchJob = asRecord(batchJobResult.data);
  if (!batchJob) {
    return new Response("Batch not found", { status: 404 });
  }

  const batchUploadId = pickString(batchJob, ["batch_upload_id"]);
  const storageBucket = pickString(batchJob, ["storage_bucket"]);

  if (!batchUploadId || !storageBucket) {
    return new Response("Batch download is unavailable", { status: 404 });
  }

  const batchUploadResult = await admin
    .from("batch_uploads")
    .select("*")
    .eq("id", batchUploadId)
    .maybeSingle();

  if (batchUploadResult.error) {
    return new Response(batchUploadResult.error.message, { status: 500 });
  }

  const batchUpload = asRecord(batchUploadResult.data);
  if (!batchUpload || pickString(batchUpload, ["user_id"]) !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const certificatesResult = await admin
    .from("certificates")
    .select("recipient_name, storage_path")
    .eq("batch_upload_id", batchUploadId);

  if (certificatesResult.error) {
    return new Response(certificatesResult.error.message, { status: 500 });
  }

  const certificates = (certificatesResult.data ?? [])
    .map((row) => asRecord(row))
    .filter((row): row is JsonRecord => Boolean(row))
    .map((row) => ({
      recipientName: pickString(row, ["recipient_name"]) || "Certificate",
      storagePath: pickString(row, ["storage_path"]),
    }))
    .filter((row) => row.storagePath);

  if (certificates.length === 0) {
    return new Response("No certificate files found for this batch", {
      status: 404,
    });
  }

  if (certificates.length === 1) {
    const signedUrlResult = await admin.storage
      .from(storageBucket)
      .createSignedUrl(certificates[0].storagePath, 60 * 15);

    if (signedUrlResult.error || !signedUrlResult.data.signedUrl) {
      return new Response(
        signedUrlResult.error?.message || "Unable to create file download link",
        { status: 500 }
      );
    }

    return Response.redirect(signedUrlResult.data.signedUrl, 302);
  }

  const lines: string[] = [];
  for (const certificate of certificates) {
    const signedUrlResult = await admin.storage
      .from(storageBucket)
      .createSignedUrl(certificate.storagePath, 60 * 15);

    if (signedUrlResult.error || !signedUrlResult.data.signedUrl) {
      return new Response(
        signedUrlResult.error?.message || "Unable to create file download links",
        { status: 500 }
      );
    }

    lines.push(`${certificate.recipientName}: ${signedUrlResult.data.signedUrl}`);
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="batch-${id}-download-links.txt"`,
      "Cache-Control": "no-store",
    },
  });
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
