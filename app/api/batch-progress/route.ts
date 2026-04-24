import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import {
  createAdminClient,
  hasSupabaseAdminEnv,
  SUPABASE_ADMIN_CONFIG_ERROR,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batch_id")?.trim();

  if (!batchId) {
    return Response.json(
      { error: "Missing required query parameter: batch_id." },
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
      { error: "Authentication required to read batch progress." },
      { status: 401 }
    );
  }

  let batchJob:
    | {
        id: string;
        batch_upload_id?: string | null;
        status?: string | null;
        processed_count?: number | null;
        total_count?: number | null;
        errors?: unknown;
      }
    | null = null;

  const directJobResult = await admin
    .from("batch_jobs")
    .select("id, batch_upload_id, status, processed_count, total_count, errors")
    .eq("id", batchId)
    .maybeSingle();

  if (directJobResult.error) {
    return Response.json(
      { error: `Unable to read batch job progress: ${directJobResult.error.message}` },
      { status: 500 }
    );
  }

  batchJob = directJobResult.data;

  if (!batchJob) {
    const latestForBatchUpload = await admin
      .from("batch_jobs")
      .select("id, batch_upload_id, status, processed_count, total_count, errors")
      .eq("batch_upload_id", batchId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestForBatchUpload.error) {
      return Response.json(
        {
          error: `Unable to read batch job progress: ${latestForBatchUpload.error.message}`,
        },
        { status: 500 }
      );
    }

    batchJob = latestForBatchUpload.data;
  }

  if (!batchJob) {
    return Response.json({ error: "Batch job not found." }, { status: 404 });
  }

  if (typeof batchJob.batch_upload_id !== "string") {
    return Response.json(
      { error: "Batch job is missing batch_upload_id." },
      { status: 500 }
    );
  }

  const { data: batchUpload, error: batchUploadError } = await supabase
    .from("batch_uploads")
    .select("id, user_id")
    .eq("id", batchJob.batch_upload_id)
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
      { error: "You do not have permission to view this batch job." },
      { status: 403 }
    );
  }

  return Response.json({
    status: batchJob.status || "queued",
    processed_count: Number(batchJob.processed_count || 0),
    total_count: Number(batchJob.total_count || 0),
    errors: normalizeErrors(batchJob.errors),
  });
}

function normalizeErrors(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}
