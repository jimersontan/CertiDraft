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

type CertificateDownloadRouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: CertificateDownloadRouteContext
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

  const admin = createAdminClient();
  const certificateResult = await admin
    .from("certificates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (certificateResult.error) {
    return new Response(certificateResult.error.message, { status: 500 });
  }

  const certificate = asRecord(certificateResult.data);
  if (!certificate) {
    return new Response("Certificate not found", { status: 404 });
  }

  const storageBucket = pickString(certificate, ["storage_bucket"]);
  const storagePath = pickString(certificate, ["storage_path"]);
  const batchUploadId = pickString(certificate, ["batch_upload_id"]);

  if (!storageBucket || !storagePath || !batchUploadId) {
    return new Response("Certificate file is unavailable", { status: 404 });
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
  if (!batchUpload) {
    return new Response("Batch upload not found", { status: 404 });
  }

  const ownerId = pickString(batchUpload, ["user_id"]);
  const ownerResult = await admin
    .from("users")
    .select("*")
    .eq("id", ownerId)
    .maybeSingle();

  if (ownerResult.error) {
    return new Response(ownerResult.error.message, { status: 500 });
  }

  const owner = asRecord(ownerResult.data);
  const isPublic =
    owner &&
    ["wallet_is_public", "is_public", "public_wallet"].some((key) => {
      const value = owner[key];
      return typeof value === "boolean" && value;
    });
  const isOwner = user?.id === ownerId;

  if (!isPublic && !isOwner) {
    return new Response("Forbidden", { status: 403 });
  }

  const signedUrlResult = await admin.storage
    .from(storageBucket)
    .createSignedUrl(storagePath, 60 * 15);

  if (signedUrlResult.error || !signedUrlResult.data.signedUrl) {
    return new Response(
      signedUrlResult.error?.message || "Unable to create certificate download link",
      { status: 500 }
    );
  }

  return Response.redirect(signedUrlResult.data.signedUrl, 302);
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
