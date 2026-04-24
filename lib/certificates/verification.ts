import {
  createAdminClient,
  hasSupabaseAdminEnv,
  SUPABASE_ADMIN_CONFIG_ERROR,
} from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

export type CertificateVerificationRecord = {
  token: string;
  recipientName: string;
  achievement: string;
  issueDate: string;
  organizationName: string;
  verificationTimestamp: string;
  statusLabel: "Verified";
  message: string;
};

export async function getCertificateVerificationRecord(token: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  if (!isUuid(token)) {
    return null;
  }

  const admin = createAdminClient();
  const verificationTimestamp = new Date().toISOString();

  const certificateResult = await admin
    .from("certificates")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle();

  if (certificateResult.error) {
    throw new Error(
      `Unable to read certificate verification data: ${certificateResult.error.message}`
    );
  }

  const certificate = asRecord(certificateResult.data);
  if (!certificate) {
    return null;
  }

  const batchUploadId = pickString(certificate, ["batch_upload_id"]);
  let organizationName = pickString(certificate, [
    "organization_name",
    "issuer_name",
    "template_name",
  ]);

  if (batchUploadId) {
    const batchUploadResult = await admin
      .from("batch_uploads")
      .select("*")
      .eq("id", batchUploadId)
      .maybeSingle();

    if (batchUploadResult.error) {
      throw new Error(
        `Unable to read certificate batch data: ${batchUploadResult.error.message}`
      );
    }

    const batchUpload = asRecord(batchUploadResult.data);
    const uploadOrganization = batchUpload
      ? pickString(batchUpload, [
          "organization_name",
          "issuer_name",
          "organization",
          "company_name",
          "company",
          "name",
          "title",
        ])
      : "";

    if (uploadOrganization) {
      organizationName = uploadOrganization;
    }

    const userId = batchUpload ? pickString(batchUpload, ["user_id"]) : "";
    if (userId) {
      const userResult = await admin
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (userResult.error) {
        throw new Error(
          `Unable to read issuer profile: ${userResult.error.message}`
        );
      }

      const userRecord = asRecord(userResult.data);
      const userOrganization = userRecord
        ? pickString(userRecord, [
            "organization_name",
            "company_name",
            "company",
            "full_name",
          ])
        : "";

      if (userOrganization) {
        organizationName = userOrganization;
      }
    }
  }

  return {
    token,
    recipientName: pickString(certificate, ["recipient_name", "name"]) || "Unknown recipient",
    achievement:
      pickString(certificate, ["achievement", "award_text", "title"]) ||
      "Certificate verified",
    issueDate:
      pickString(certificate, ["issued_at", "issue_date", "generated_at", "created_at"]) ||
      verificationTimestamp,
    organizationName: organizationName || "CertiDraft",
    verificationTimestamp,
    statusLabel: "Verified" as const,
    message: "This certificate is authentic and verified.",
  };
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
