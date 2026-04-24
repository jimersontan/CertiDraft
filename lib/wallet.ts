import {
  createAdminClient,
  hasSupabaseAdminEnv,
  SUPABASE_ADMIN_CONFIG_ERROR,
} from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

export type WalletCertificate = {
  id: string;
  recipientName: string;
  achievement: string;
  issueDate: string;
  issuer: string;
  verificationToken: string;
  verificationUrl: string;
  storageBucket: string;
  storagePath: string;
  downloadPath: string;
  thumbnailLabel: string;
};

export type WalletData = {
  userId: string;
  slug: string;
  name: string;
  title: string;
  isPublic: boolean;
  canEdit: boolean;
  isAccessible: boolean;
  certificates: WalletCertificate[];
};

export type WalletSettings = {
  userId: string;
  slug: string;
  title: string;
  isPublic: boolean;
  supportsSlugEditing: boolean;
  supportsVisibilityToggle: boolean;
};

export async function getWalletDataBySlug(input: {
  slug: string;
  viewerUserId?: string;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  const admin = createAdminClient();
  const user = await findWalletUserBySlug(admin, input.slug);
  if (!user) {
    return null;
  }

  const isPublic = resolveIsPublic(user);
  const canEdit = pickString(user, ["id"]) === input.viewerUserId;
  const isAccessible = isPublic || canEdit;

  const baseData = {
    userId: pickString(user, ["id"]),
    slug: resolveWalletSlug(user),
    name:
      pickString(user, ["full_name", "organization_name", "company_name", "email"]) ||
      "CertiDraft User",
    title:
      pickString(user, ["wallet_title", "title", "headline"]) ||
      "Digital Certificate Wallet",
    isPublic,
    canEdit,
    isAccessible,
    certificates: [],
  } satisfies WalletData;

  if (!isAccessible) {
    return baseData;
  }

  const batchUploadsResult = await admin
    .from("batch_uploads")
    .select("*")
    .eq("user_id", baseData.userId)
    .order("created_at", { ascending: false });

  if (batchUploadsResult.error) {
    throw new Error(
      `Unable to read wallet batches: ${batchUploadsResult.error.message}`
    );
  }

  const batchUploads = (batchUploadsResult.data ?? [])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is JsonRecord => Boolean(entry));
  const batchUploadIds = batchUploads
    .map((entry) => pickString(entry, ["id"]))
    .filter(Boolean);

  if (batchUploadIds.length === 0) {
    return baseData;
  }

  const certificatesResult = await admin
    .from("certificates")
    .select("*")
    .in("batch_upload_id", batchUploadIds)
    .order("created_at", { ascending: false });

  if (certificatesResult.error) {
    throw new Error(
      `Unable to read wallet certificates: ${certificatesResult.error.message}`
    );
  }

  const issuerName =
    pickString(user, ["organization_name", "company_name", "full_name"]) ||
    "CertiDraft";

  const certificates = (certificatesResult.data ?? [])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is JsonRecord => Boolean(entry))
    .filter((entry) => pickString(entry, ["storage_path"]))
    .map((entry) => {
      const recipientName =
        pickString(entry, ["recipient_name", "name"]) || "Certificate recipient";
      const issueDate =
        pickString(entry, ["issued_at", "generated_at", "created_at"]) || "";
      const verificationToken = pickString(entry, ["verification_token"]);
      const verificationUrl =
        pickString(entry, ["verification_url"]) ||
        buildVerificationUrl(verificationToken);

      return {
        id: pickString(entry, ["id"]),
        recipientName,
        achievement:
          pickString(entry, ["achievement", "title", "citation_text"]) ||
          "Certificate issued",
        issueDate,
        issuer: issuerName,
        verificationToken,
        verificationUrl,
        storageBucket: pickString(entry, ["storage_bucket"]),
        storagePath: pickString(entry, ["storage_path"]),
        downloadPath: `/api/certificates/${pickString(entry, ["id"])}/download`,
        thumbnailLabel: buildInitials(recipientName),
      };
    });

  return {
    ...baseData,
    certificates,
  } satisfies WalletData;
}

export async function getWalletSettings(userId: string) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  const admin = createAdminClient();
  const userResult = await admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (userResult.error) {
    throw new Error(`Unable to read wallet settings: ${userResult.error.message}`);
  }

  const user = asRecord(userResult.data);
  if (!user) {
    return null;
  }

  return {
    userId,
    slug: resolveWalletSlug(user),
    title:
      pickString(user, ["wallet_title", "title", "headline"]) ||
      "Digital Certificate Wallet",
    isPublic: resolveIsPublic(user),
    supportsSlugEditing: hasAnyKey(user, ["wallet_slug", "slug"]),
    supportsVisibilityToggle: hasAnyKey(user, [
      "wallet_is_public",
      "is_public",
      "public_wallet",
    ]),
  } satisfies WalletSettings;
}

export async function updateWalletSettings(input: {
  userId: string;
  slug: string;
  title: string;
  isPublic: boolean;
}) {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  const admin = createAdminClient();
  const userResult = await admin
    .from("users")
    .select("*")
    .eq("id", input.userId)
    .maybeSingle();

  if (userResult.error) {
    throw new Error(`Unable to load wallet profile: ${userResult.error.message}`);
  }

  const user = asRecord(userResult.data);
  if (!user) {
    throw new Error("Wallet profile not found.");
  }

  const updatePayload: JsonRecord = {};
  const normalizedSlug = sanitizeSlug(input.slug) || resolveWalletSlug(user);
  const normalizedTitle = input.title.trim() || "Digital Certificate Wallet";

  if ("wallet_slug" in user) {
    updatePayload.wallet_slug = normalizedSlug;
  } else if ("slug" in user) {
    updatePayload.slug = normalizedSlug;
  }

  if ("wallet_title" in user) {
    updatePayload.wallet_title = normalizedTitle;
  } else if ("title" in user) {
    updatePayload.title = normalizedTitle;
  }

  if ("wallet_is_public" in user) {
    updatePayload.wallet_is_public = input.isPublic;
  } else if ("is_public" in user) {
    updatePayload.is_public = input.isPublic;
  } else if ("public_wallet" in user) {
    updatePayload.public_wallet = input.isPublic;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new Error(
      "Wallet settings columns are not available in the users table yet."
    );
  }

  const updateResult = await admin
    .from("users")
    .update(updatePayload)
    .eq("id", input.userId);

  if (updateResult.error) {
    throw new Error(
      `Unable to update wallet settings: ${updateResult.error.message}`
    );
  }

  return {
    slug: normalizedSlug,
    title: normalizedTitle,
    isPublic: input.isPublic,
  };
}

async function findWalletUserBySlug(
  admin: ReturnType<typeof createAdminClient>,
  slug: string
) {
  const usersResult = await admin.from("users").select("*");

  if (usersResult.error) {
    throw new Error(`Unable to read wallets: ${usersResult.error.message}`);
  }

  const normalizedSlug = sanitizeSlug(slug);

  return (
    (usersResult.data ?? [])
      .map((entry) => asRecord(entry))
      .filter((entry): entry is JsonRecord => Boolean(entry))
      .find((entry) => resolveWalletSlug(entry) === normalizedSlug) ?? null
  );
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

function hasAnyKey(record: JsonRecord, keys: string[]) {
  return keys.some((key) => key in record);
}

function resolveWalletSlug(record: JsonRecord) {
  const explicitSlug = sanitizeSlug(pickString(record, ["wallet_slug", "slug"]));
  if (explicitSlug) {
    return explicitSlug;
  }

  const base = pickString(record, ["full_name", "email"]) || pickString(record, ["id"]);
  return sanitizeSlug(base) || "wallet";
}

function resolveIsPublic(record: JsonRecord) {
  for (const key of ["wallet_is_public", "is_public", "public_wallet"]) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return false;
}

function sanitizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildInitials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "CD";
}

function buildVerificationUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://certidraft.com";

  return token
    ? `${siteUrl.replace(/\/+$/, "")}/verify/${encodeURIComponent(token)}`
    : siteUrl;
}
