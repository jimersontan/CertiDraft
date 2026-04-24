import {
  createAdminClient,
  hasSupabaseAdminEnv,
  SUPABASE_ADMIN_CONFIG_ERROR,
} from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

export type DashboardStats = {
  totalCertificates: number;
  batchesCompleted: number;
  certificatesThisMonth: number;
};

export type RecentBatch = {
  id: string;
  batchUploadId: string;
  name: string;
  status: string;
  processedCount: number;
  totalCount: number;
  createdAt: string;
  completedAt: string;
  storageBucket: string;
  certificateCount: number;
};

export type DashboardData = {
  greetingName: string;
  profileName: string;
  stats: DashboardStats;
  recentBatches: RecentBatch[];
};

export async function getDashboardData(input: {
  userId: string;
  email?: string;
  fallbackName?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  const admin = createAdminClient();
  const profileResult = await admin
    .from("users")
    .select("*")
    .eq("id", input.userId)
    .maybeSingle();

  if (profileResult.error) {
    throw new Error(`Unable to read user profile: ${profileResult.error.message}`);
  }

  const profile = asRecord(profileResult.data);
  const profileName =
    pickString(profile, ["full_name", "organization_name", "company_name"]) ||
    input.fallbackName ||
    input.email ||
    "there";

  const batchUploadsResult = await admin
    .from("batch_uploads")
    .select("*")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (batchUploadsResult.error) {
    throw new Error(
      `Unable to read batch uploads: ${batchUploadsResult.error.message}`
    );
  }

  const batchUploads = (batchUploadsResult.data ?? [])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is JsonRecord => Boolean(entry));
  const batchUploadIds = batchUploads
    .map((entry) => pickString(entry, ["id"]))
    .filter(Boolean);
  const uploadNames = new Map(
    batchUploads.map((entry) => [
      pickString(entry, ["id"]),
      resolveBatchName(entry),
    ])
  );

  if (batchUploadIds.length === 0) {
    return {
      greetingName: profileName,
      profileName,
      stats: {
        totalCertificates: 0,
        batchesCompleted: 0,
        certificatesThisMonth: 0,
      },
      recentBatches: [],
    } satisfies DashboardData;
  }

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  const [recentBatchJobsResult, totalCertificatesResult, batchesCompletedResult, monthCertificatesResult] =
    await Promise.all([
      admin
        .from("batch_jobs")
        .select("*")
        .in("batch_upload_id", batchUploadIds)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .in("batch_upload_id", batchUploadIds),
      admin
        .from("batch_jobs")
        .select("id", { count: "exact", head: true })
        .in("batch_upload_id", batchUploadIds)
        .in("status", ["completed", "completed_with_errors"]),
      admin
        .from("certificates")
        .select("id", { count: "exact", head: true })
        .in("batch_upload_id", batchUploadIds)
        .gte("created_at", monthStart),
    ]);

  if (recentBatchJobsResult.error) {
    throw new Error(
      `Unable to read recent batch jobs: ${recentBatchJobsResult.error.message}`
    );
  }
  if (totalCertificatesResult.error) {
    throw new Error(
      `Unable to read certificate totals: ${totalCertificatesResult.error.message}`
    );
  }
  if (batchesCompletedResult.error) {
    throw new Error(
      `Unable to read completed batch totals: ${batchesCompletedResult.error.message}`
    );
  }
  if (monthCertificatesResult.error) {
    throw new Error(
      `Unable to read monthly certificate totals: ${monthCertificatesResult.error.message}`
    );
  }

  const recentBatchJobs = (recentBatchJobsResult.data ?? [])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is JsonRecord => Boolean(entry));
  const recentBatchIds = recentBatchJobs
    .map((entry) => pickString(entry, ["batch_upload_id"]))
    .filter(Boolean);

  const certificateRowsResult = recentBatchIds.length
    ? await admin
        .from("certificates")
        .select("batch_upload_id")
        .in("batch_upload_id", recentBatchIds)
    : { data: [], error: null as null };

  if (certificateRowsResult.error) {
    throw new Error(
      `Unable to read batch certificate counts: ${certificateRowsResult.error.message}`
    );
  }

  const certificateCountsByBatch = new Map<string, number>();
  for (const row of certificateRowsResult.data ?? []) {
    const record = asRecord(row);
    const batchUploadId = record ? pickString(record, ["batch_upload_id"]) : "";
    if (!batchUploadId) {
      continue;
    }

    certificateCountsByBatch.set(
      batchUploadId,
      (certificateCountsByBatch.get(batchUploadId) ?? 0) + 1
    );
  }

  return {
    greetingName: profileName,
    profileName,
    stats: {
      totalCertificates: totalCertificatesResult.count ?? 0,
      batchesCompleted: batchesCompletedResult.count ?? 0,
      certificatesThisMonth: monthCertificatesResult.count ?? 0,
    },
    recentBatches: recentBatchJobs.map((entry) => {
      const batchUploadId = pickString(entry, ["batch_upload_id"]);
      return {
        id: pickString(entry, ["id"]),
        batchUploadId,
        name: uploadNames.get(batchUploadId) || `Batch ${batchUploadId.slice(0, 8)}`,
        status: pickString(entry, ["status"]) || "queued",
        processedCount: pickNumber(entry, ["processed_count"]),
        totalCount: pickNumber(entry, ["total_count"]),
        createdAt: pickString(entry, ["created_at", "updated_at"]),
        completedAt: pickString(entry, ["completed_at"]),
        storageBucket: pickString(entry, ["storage_bucket"]),
        certificateCount: certificateCountsByBatch.get(batchUploadId) ?? 0,
      };
    }),
  } satisfies DashboardData;
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

  return 0;
}

function resolveBatchName(record: JsonRecord) {
  return (
    pickString(record, [
      "name",
      "title",
      "original_filename",
      "file_name",
      "filename",
      "csv_name",
    ]) || `Batch ${pickString(record, ["id"]).slice(0, 8)}`
  );
}
