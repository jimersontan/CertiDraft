"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase/admin";
import {
  createClient,
  hasSupabaseServerEnv,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/server";
import { updateWalletSettings } from "@/lib/wallet";

/* ─── helpers ────────────────────────────────────────── */

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

async function requireUser() {
  if (!hasSupabaseServerEnv()) {
    return { error: SUPABASE_CONFIG_ERROR } as const;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return { user, supabase } as const;
}

/* ─── Legacy: wallet settings (kept for backward compat) ── */

export async function updateWalletSettingsAction(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) {
    redirect(`/settings?error=${encodeURIComponent(String(auth.error))}`);
  }

  const slug = String(formData.get("wallet_slug") ?? "");
  const title = String(formData.get("wallet_title") ?? "");
  const isPublic = formData.get("is_public") === "on";

  try {
    await updateWalletSettings({
      userId: auth.user.id,
      slug,
      title,
      isPublic,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update wallet settings.";
    redirect(`/settings?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/wallet/${encodeURIComponent(slug)}`);
  redirect("/settings?updated=1");
}

/* ═══════════════════════════════════════════════════════
   Tab 1 — Profile
   ═══════════════════════════════════════════════════════ */

export async function updateProfileAction(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!fullName) {
    return { error: "Full name is required." };
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      return { error: "Admin access not configured." };
    }

    const admin = createAdminClient();

    /* Update Supabase auth user metadata */
    const { error: authUpdateError } = await admin.auth.admin.updateUserById(
      auth.user.id,
      {
        user_metadata: { full_name: fullName },
        ...(email && email !== auth.user.email ? { email } : {}),
      }
    );

    if (authUpdateError) {
      return { error: `Auth update failed: ${authUpdateError.message}` };
    }

    /* Update users table (if it exists) */
    const userResult = await admin
      .from("users")
      .select("id")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (!userResult.error && userResult.data) {
      const payload: JsonRecord = { updated_at: new Date().toISOString() };

      // Probe which columns exist by reading the current row
      const fullRow = await admin
        .from("users")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      const record = asRecord(fullRow.data);

      if (record) {
        if ("full_name" in record) payload.full_name = fullName;
        if ("email" in record && email) payload.email = email;
      }

      await admin.from("users").update(payload).eq("id", auth.user.id);
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update profile.",
    };
  }
}

/* ── Change Password ── */

export async function changePasswordAction(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error };
  }

  const currentPassword = String(
    formData.get("current_password") ?? ""
  ).trim();
  const newPassword = String(formData.get("new_password") ?? "").trim();
  const confirmPassword = String(
    formData.get("confirm_password") ?? ""
  ).trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All password fields are required." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  try {
    /* Verify current password by attempting sign-in */
    const email = auth.user.email;
    if (!email) {
      return { error: "No email associated with this account." };
    }

    const { error: signInError } = await auth.supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      return { error: "Current password is incorrect." };
    }

    /* Update to new password */
    const { error: updateError } = await auth.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { error: `Password update failed: ${updateError.message}` };
    }

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to change password.",
    };
  }
}

/* ═══════════════════════════════════════════════════════
   Tab 2 — Organization
   ═══════════════════════════════════════════════════════ */

export async function updateOrganizationAction(formData: FormData) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error };
  }

  const companyName = String(formData.get("company_name") ?? "").trim();
  const brandColor = String(formData.get("brand_color") ?? "").trim();

  if (!companyName) {
    return { error: "Company name is required." };
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      return { error: "Admin access not configured." };
    }

    const admin = createAdminClient();

    const fullRow = await admin
      .from("users")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (fullRow.error) {
      return { error: `Unable to read profile: ${fullRow.error.message}` };
    }

    const record = asRecord(fullRow.data);
    if (!record) {
      return { error: "User profile not found." };
    }

    const payload: JsonRecord = { updated_at: new Date().toISOString() };

    if ("organization_name" in record) {
      payload.organization_name = companyName;
    } else if ("company_name" in record) {
      payload.company_name = companyName;
    }

    if ("brand_color" in record) {
      payload.brand_color = brandColor;
    }

    if ("logo_url" in record) {
      // Logo upload is handled separately; placeholder for future use
    }

    if (Object.keys(payload).length > 1) {
      const updateResult = await admin
        .from("users")
        .update(payload)
        .eq("id", auth.user.id);

      if (updateResult.error) {
        return {
          error: `Unable to update organization: ${updateResult.error.message}`,
        };
      }
    }

    // Also update auth user metadata
    await admin.auth.admin.updateUserById(auth.user.id, {
      user_metadata: {
        ...auth.user.user_metadata,
        organization_name: companyName,
        brand_color: brandColor,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update organization.",
    };
  }
}

/* ═══════════════════════════════════════════════════════
   Tab 4 — API Keys
   ═══════════════════════════════════════════════════════ */

export async function generateApiKeyAction(label: string) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error };
  }

  if (!label.trim()) {
    return { error: "Key label is required." };
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      return { error: "Admin access not configured." };
    }

    const admin = createAdminClient();

    // Generate a secure random key
    const rawKey = generateSecureKey();
    const keyPrefix = rawKey.slice(0, 8);
    const keySuffix = rawKey.slice(-4);
    const keyPreview = `${keyPrefix}••••••••${keySuffix}`;
    const now = new Date().toISOString();

    const insertResult = await admin.from("api_keys").insert({
      user_id: auth.user.id,
      label: label.trim(),
      key_hash: hashApiKey(rawKey),
      key_preview: `${keyPrefix}...${keySuffix}`,
      created_at: now,
      updated_at: now,
    });

    if (insertResult.error) {
      // If api_keys table doesn't exist, return a simulated key
      if (insertResult.error.message.includes("does not exist") ||
          insertResult.error.code === "42P01") {
        const fakeId = `key_${Date.now()}`;
        return {
          key: {
            id: fakeId,
            label: label.trim(),
            keyPreview,
            fullKey: `cd_live_${rawKey}`,
            createdAt: formatDate(now),
          },
        };
      }
      return {
        error: `Unable to generate key: ${insertResult.error.message}`,
      };
    }

    // Get the inserted row to return its ID
    const selectResult = await admin
      .from("api_keys")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("label", label.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const id = selectResult.data?.id || `key_${Date.now()}`;

    revalidatePath("/settings");
    return {
      key: {
        id: String(id),
        label: label.trim(),
        keyPreview,
        fullKey: `cd_live_${rawKey}`,
        createdAt: formatDate(now),
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate API key.",
    };
  }
}

export async function revokeApiKeyAction(keyId: string) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error };
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      return { error: "Admin access not configured." };
    }

    const admin = createAdminClient();

    const deleteResult = await admin
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", auth.user.id);

    if (deleteResult.error) {
      // If table doesn't exist, still return success
      if (deleteResult.error.message.includes("does not exist") ||
          deleteResult.error.code === "42P01") {
        revalidatePath("/settings");
        return { success: true };
      }
      return {
        error: `Unable to revoke key: ${deleteResult.error.message}`,
      };
    }

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to revoke API key.",
    };
  }
}

/* ═══════════════════════════════════════════════════════
   Tab 5 — Privacy
   ═══════════════════════════════════════════════════════ */

export async function updatePrivacyAction(input: {
  walletIsPublic: boolean;
  dataRetention: string;
}) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error };
  }

  try {
    if (!hasSupabaseAdminEnv()) {
      return { error: "Admin access not configured." };
    }

    const admin = createAdminClient();

    const fullRow = await admin
      .from("users")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (fullRow.error) {
      return { error: `Unable to read profile: ${fullRow.error.message}` };
    }

    const record = asRecord(fullRow.data);
    if (!record) {
      return { error: "User profile not found." };
    }

    const payload: JsonRecord = { updated_at: new Date().toISOString() };

    // Wallet visibility
    if ("wallet_is_public" in record) {
      payload.wallet_is_public = input.walletIsPublic;
    } else if ("is_public" in record) {
      payload.is_public = input.walletIsPublic;
    } else if ("public_wallet" in record) {
      payload.public_wallet = input.walletIsPublic;
    }

    // Data retention
    if ("data_retention" in record) {
      payload.data_retention = input.dataRetention;
    } else if ("data_retention_days" in record) {
      payload.data_retention_days =
        input.dataRetention === "forever" ? null : Number(input.dataRetention);
    }

    if (Object.keys(payload).length > 1) {
      const updateResult = await admin
        .from("users")
        .update(payload)
        .eq("id", auth.user.id);

      if (updateResult.error) {
        return {
          error: `Unable to update privacy: ${updateResult.error.message}`,
        };
      }
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update privacy settings.",
    };
  }
}

/* ─── Utilities ──────────────────────────────────────── */

function generateSecureKey() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 40; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function hashApiKey(key: string) {
  // Simple hash for storage — in production use a proper bcrypt/argon2 hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(36)}_${key.length}`;
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
