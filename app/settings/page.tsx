import { redirect } from "next/navigation";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  SettingsClient,
  type SettingsApiKey,
  type SettingsBilling,
  type SettingsOrganization,
  type SettingsPrivacy,
  type SettingsProfile,
} from "@/components/settings/settings-client";
import {
  createAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase/admin";
import {
  createClient,
  hasSupabaseServerEnv,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type SettingsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  if (!hasSupabaseServerEnv()) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Alert variant="destructive">
            <AlertTitle>Settings unavailable</AlertTitle>
            <AlertDescription>{SUPABASE_CONFIG_ERROR}</AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const query = await searchParams;

  /* ─── Fetch user profile from the users table ─── */

  let userRecord: JsonRecord | null = null;

  if (hasSupabaseAdminEnv()) {
    const admin = createAdminClient();
    const userResult = await admin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!userResult.error && userResult.data) {
      userRecord = userResult.data as JsonRecord;
    }
  }

  /* ─── Build Profile data ─── */

  const profile: SettingsProfile = {
    fullName:
      pickString(userRecord, ["full_name", "name"]) ||
      user.user_metadata?.full_name ||
      "",
    email: user.email || "",
  };

  /* ─── Build Organization data ─── */

  const organization: SettingsOrganization = {
    companyName:
      pickString(userRecord, [
        "organization_name",
        "company_name",
        "company",
      ]) ||
      user.user_metadata?.organization_name ||
      "",
    logoUrl: pickString(userRecord, ["logo_url", "avatar_url"]) || "",
    brandColor:
      pickString(userRecord, ["brand_color"]) ||
      user.user_metadata?.brand_color ||
      "#2563eb",
  };

  /* ─── Build Billing data ─── */

  const rawPlan = pickString(userRecord, ["plan", "subscription_plan"]);
  const planName = rawPlan || "Free";

  const billing: SettingsBilling = {
    planName: capitalize(planName),
    planDescription: getPlanDescription(planName),
    priceLabel: getPlanPrice(planName),
    paymentHistory: await fetchPaymentHistory(user.id),
  };

  /* ─── Build API Keys ─── */

  const apiKeys = await fetchApiKeys(user.id);

  /* ─── Build Privacy data ─── */

  const privacy: SettingsPrivacy = {
    walletIsPublic: resolveIsPublic(userRecord),
    dataRetention:
      pickString(userRecord, ["data_retention", "data_retention_days"]) ||
      "forever",
    walletSlug: resolveWalletSlug(userRecord, user),
    supportsVisibilityToggle: userRecord
      ? hasAnyKey(userRecord, [
          "wallet_is_public",
          "is_public",
          "public_wallet",
        ])
      : false,
  };

  return (
    <SettingsClient
      profile={profile}
      organization={organization}
      billing={billing}
      apiKeys={apiKeys}
      privacy={privacy}
      defaultTab={query.tab || "profile"}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   Data Helpers
   ═══════════════════════════════════════════════════════ */

function pickString(record: JsonRecord | null, keys: string[]) {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function hasAnyKey(record: JsonRecord, keys: string[]) {
  return keys.some((key) => key in record);
}

function resolveIsPublic(record: JsonRecord | null) {
  if (!record) return false;
  for (const key of ["wallet_is_public", "is_public", "public_wallet"]) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return false;
}

function resolveWalletSlug(
  record: JsonRecord | null,
  user: { id: string; email?: string; user_metadata?: Record<string, string> }
) {
  const explicit = pickString(record, ["wallet_slug", "slug"]);
  if (explicit) return explicit;

  const base =
    pickString(record, ["full_name", "email"]) ||
    user.email ||
    user.id;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getPlanDescription(plan: string) {
  const normalized = plan.toLowerCase();
  if (normalized === "pro" || normalized === "premium") {
    return "Full access to all features, templates, and priority support.";
  }
  if (normalized === "team" || normalized === "enterprise") {
    return "Multi-user workspace with team management and custom branding.";
  }
  return "Get started with basic certificate generation. Upgrade to unlock templates, batch emailing, and more.";
}

function getPlanPrice(plan: string) {
  const normalized = plan.toLowerCase();
  if (normalized === "pro" || normalized === "premium") return "$19/mo";
  if (normalized === "team") return "$49/mo";
  if (normalized === "enterprise") return "Custom";
  return "$0/mo";
}

async function fetchPaymentHistory(userId: string) {
  if (!hasSupabaseAdminEnv()) return [];

  try {
    const admin = createAdminClient();
    const result = await admin
      .from("payment_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (result.error || !result.data) return [];

    return result.data.map((row: JsonRecord) => ({
      id: String(row.id || ""),
      date: formatDate(String(row.created_at || row.date || "")),
      amount: String(row.amount || "$0.00"),
      description: String(row.description || row.plan || "Subscription"),
      status: String(row.status || "paid"),
    }));
  } catch {
    return [];
  }
}

async function fetchApiKeys(userId: string): Promise<SettingsApiKey[]> {
  if (!hasSupabaseAdminEnv()) return [];

  try {
    const admin = createAdminClient();
    const result = await admin
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (result.error || !result.data) return [];

    return result.data.map((row: JsonRecord) => ({
      id: String(row.id || ""),
      label: String(row.label || "API Key"),
      keyPreview: String(row.key_preview || "cd_live_••••"),
      createdAt: formatDate(String(row.created_at || "")),
    }));
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "Unknown";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    parsed
  );
}
