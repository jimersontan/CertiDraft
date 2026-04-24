"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Globe2,
  Key,
  Loader2,
  Lock,
  Palette,
  Plus,
  Settings2,
  Shield,
  Trash2,
  Upload,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";

import {
  changePasswordAction,
  generateApiKeyAction,
  revokeApiKeyAction,
  updateOrganizationAction,
  updatePrivacyAction,
  updateProfileAction,
} from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ─── Types ──────────────────────────────────────────── */

export type SettingsProfile = {
  fullName: string;
  email: string;
};

export type SettingsOrganization = {
  companyName: string;
  logoUrl: string;
  brandColor: string;
};

export type SettingsBilling = {
  planName: string;
  planDescription: string;
  priceLabel: string;
  paymentHistory: Array<{
    id: string;
    date: string;
    amount: string;
    description: string;
    status: string;
  }>;
};

export type SettingsApiKey = {
  id: string;
  label: string;
  keyPreview: string;
  createdAt: string;
};

export type SettingsPrivacy = {
  walletIsPublic: boolean;
  dataRetention: string;
  walletSlug: string;
  supportsVisibilityToggle: boolean;
};

export type SettingsClientProps = {
  profile: SettingsProfile;
  organization: SettingsOrganization;
  billing: SettingsBilling;
  apiKeys: SettingsApiKey[];
  privacy: SettingsPrivacy;
  defaultTab?: string;
};

/* ─── Brand color presets ────────────────────────────── */

const brandPresets = [
  { label: "Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Purple", value: "#7c3aed" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
  { label: "Teal", value: "#0d9488" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Slate", value: "#475569" },
];

/* ─── Main Component ─────────────────────────────────── */

export function SettingsClient({
  profile,
  organization,
  billing,
  apiKeys: initialApiKeys,
  privacy,
  defaultTab = "profile",
}: SettingsClientProps) {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <Settings2 className="size-4" />
              Account settings
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              Settings & Profile
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Manage your account, organization, billing, API keys, and privacy
              preferences — all in one place.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="profile" className="gap-1.5">
              <UserCircle2 className="size-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-1.5">
              <Building2 className="size-4" />
              <span className="hidden sm:inline">Organization</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-1.5">
              <CreditCard className="size-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-1.5">
              <Key className="size-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5">
              <Shield className="size-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab profile={profile} />
          </TabsContent>

          <TabsContent value="organization">
            <OrganizationTab organization={organization} />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab billing={billing} />
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeysTab initialApiKeys={initialApiKeys} />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyTab privacy={privacy} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════
   Tab 1 — Profile
   ═══════════════════════════════════════════════════════ */

function ProfileTab({ profile }: { profile: SettingsProfile }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      startTransition(async () => {
        const result = await updateProfileAction(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Profile updated successfully.");
        }
      });
    },
    []
  );

  return (
    <div className="space-y-6 pt-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserCircle2 className="size-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information. Your name will appear on
            certificates and your public wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile_full_name">Full Name</Label>
                <Input
                  id="profile_full_name"
                  name="full_name"
                  defaultValue={profile.fullName}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile_email">Email Address</Label>
                <Input
                  id="profile_email"
                  name="email"
                  type="email"
                  defaultValue={profile.email}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save Profile
              </Button>

              <ChangePasswordDialog />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Change Password Dialog ── */

function ChangePasswordDialog() {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleSubmit = useCallback(
    (formData: FormData) => {
      startTransition(async () => {
        const result = await changePasswordAction(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Password changed successfully.");
          setOpen(false);
        }
      });
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Lock className="size-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current and new password below.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              name="current_password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-4" />
              )}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   Tab 2 — Organization
   ═══════════════════════════════════════════════════════ */

function OrganizationTab({
  organization,
}: {
  organization: SettingsOrganization;
}) {
  const [isPending, startTransition] = useTransition();
  const [brandColor, setBrandColor] = useState(
    organization.brandColor || "#2563eb"
  );

  const handleSubmit = useCallback(
    (formData: FormData) => {
      formData.set("brand_color", brandColor);
      startTransition(async () => {
        const result = await updateOrganizationAction(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success("Organization settings saved.");
        }
      });
    },
    [brandColor]
  );

  return (
    <div className="space-y-6 pt-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="size-5 text-primary" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Company details and branding that appear on certificates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="org_company_name">Company / Organization Name</Label>
              <Input
                id="org_company_name"
                name="company_name"
                defaultValue={organization.companyName}
                placeholder="Acme Corp"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30">
                  {organization.logoUrl ? (
                    <Image
                      src={organization.logoUrl}
                      alt="Organization logo"
                      width={80}
                      height={80}
                      className="size-full rounded-2xl object-cover"
                    />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" type="button" disabled>
                    <Upload className="size-4" />
                    Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG or SVG. Max 2 MB. Logo upload requires Supabase
                    Storage.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Color Picker */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                Brand Color
              </Label>
              <div className="flex flex-wrap items-center gap-3">
                {/* Native color input */}
                <div className="relative">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(event) => setBrandColor(event.target.value)}
                    className="size-10 cursor-pointer rounded-xl border border-input bg-transparent p-0.5"
                  />
                </div>
                <Input
                  value={brandColor}
                  onChange={(event) => setBrandColor(event.target.value)}
                  className="w-28 font-mono text-sm"
                  maxLength={7}
                />
                <span className="text-sm text-muted-foreground">|</span>
                {/* Preset swatches */}
                <div className="flex flex-wrap gap-1.5">
                  {brandPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.label}
                      onClick={() => setBrandColor(preset.value)}
                      className={`size-7 rounded-lg border-2 transition-all hover:scale-110 ${
                        brandColor === preset.value
                          ? "border-foreground ring-2 ring-primary/30"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: preset.value }}
                    />
                  ))}
                </div>
              </div>
              {/* Live preview */}
              <div
                className="flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                Certificate Header Preview
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save Organization
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Tab 3 — Billing
   ═══════════════════════════════════════════════════════ */

function BillingTab({ billing }: { billing: SettingsBilling }) {
  return (
    <div className="space-y-6 pt-2">
      {/* Current Plan */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="size-5 text-primary" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Review your current subscription and manage upgrades.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {billing.planName}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {billing.planDescription}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tracking-tight">
                  {billing.priceLabel}
                </p>
                <Button className="mt-3" size="sm">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all past invoices and payment records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billing.paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="border-b border-border/60 px-4 py-3 font-medium">
                      Date
                    </th>
                    <th className="border-b border-border/60 px-4 py-3 font-medium">
                      Description
                    </th>
                    <th className="border-b border-border/60 px-4 py-3 font-medium">
                      Amount
                    </th>
                    <th className="border-b border-border/60 px-4 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billing.paymentHistory.map((entry) => (
                    <tr key={entry.id} className="align-top">
                      <td className="border-b border-border/40 px-4 py-3 text-sm text-foreground">
                        {entry.date}
                      </td>
                      <td className="border-b border-border/40 px-4 py-3 text-sm text-muted-foreground">
                        {entry.description}
                      </td>
                      <td className="border-b border-border/40 px-4 py-3 text-sm font-medium text-foreground">
                        {entry.amount}
                      </td>
                      <td className="border-b border-border/40 px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                            entry.status === "paid"
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-700"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
              <CreditCard className="mx-auto size-8 text-muted-foreground/50" />
              <h3 className="mt-3 text-base font-semibold">
                No payment history
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Payment records will appear here when you subscribe to a paid
                plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Tab 4 — API Keys
   ═══════════════════════════════════════════════════════ */

function ApiKeysTab({
  initialApiKeys,
}: {
  initialApiKeys: SettingsApiKey[];
}) {
  const [keys, setKeys] = useState<SettingsApiKey[]>(initialApiKeys);
  const [isPending, startTransition] = useTransition();
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [generatedKeyFull, setGeneratedKeyFull] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(() => {
    if (!newKeyLabel.trim()) {
      toast.error("Please enter a label for the new API key.");
      return;
    }

    startTransition(async () => {
      const result = await generateApiKeyAction(newKeyLabel.trim());
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.key) {
        setGeneratedKeyFull(result.key.fullKey);
        setKeys((prev) => [
          {
            id: result.key.id,
            label: result.key.label,
            keyPreview: result.key.keyPreview,
            createdAt: result.key.createdAt,
          },
          ...prev,
        ]);
        setNewKeyLabel("");
        toast.success("API key generated. Copy it now — you won't see it again.");
      }
    });
  }, [newKeyLabel]);

  const handleRevoke = useCallback((keyId: string) => {
    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setKeys((prev) => prev.filter((key) => key.id !== keyId));
        toast.success("API key revoked.");
      }
    });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied to clipboard."),
      () => toast.error("Unable to copy.")
    );
  }, []);

  const toggleReveal = useCallback((keyId: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6 pt-2">
      {/* Generate */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Key className="size-5 text-primary" />
            API Keys
          </CardTitle>
          <CardDescription>
            Generate keys to integrate CertiDraft with your applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="api_key_label">Key Label</Label>
              <Input
                id="api_key_label"
                value={newKeyLabel}
                onChange={(event) => setNewKeyLabel(event.target.value)}
                placeholder="e.g. Production Server"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isPending || !newKeyLabel.trim()}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Generate New Key
            </Button>
          </div>

          {/* Newly generated key (show once) */}
          {generatedKeyFull ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-sm font-medium text-amber-700">
                ⚠ Copy your key now — it will not be shown again.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-muted/60 px-3 py-2 font-mono text-sm break-all">
                  {generatedKeyFull}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedKeyFull)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Existing Keys */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            Manage your existing API keys. Revoke any that are no longer needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length > 0 ? (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{key.label}</p>
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                        {revealedKeys.has(key.id)
                          ? key.keyPreview
                          : key.keyPreview.replace(
                              /(?<=^.{8}).+(?=.{4}$)/,
                              "••••••••••••"
                            )}
                      </code>
                      <button
                        type="button"
                        className="text-muted-foreground transition hover:text-foreground"
                        onClick={() => toggleReveal(key.id)}
                      >
                        {revealedKeys.has(key.id) ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {key.createdAt}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(key.keyPreview)}
                    >
                      <Copy className="size-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(key.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
              <Key className="mx-auto size-8 text-muted-foreground/50" />
              <h3 className="mt-3 text-base font-semibold">No API keys yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Generate your first key above to start integrating.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Tab 5 — Privacy
   ═══════════════════════════════════════════════════════ */

function PrivacyTab({ privacy }: { privacy: SettingsPrivacy }) {
  const [isPending, startTransition] = useTransition();
  const [isPublic, setIsPublic] = useState(privacy.walletIsPublic);
  const [retention, setRetention] = useState(privacy.dataRetention);

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      const result = await updatePrivacyAction({
        walletIsPublic: isPublic,
        dataRetention: retention,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Privacy settings saved.");
      }
    });
  }, [isPublic, retention]);

  return (
    <div className="space-y-6 pt-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="size-5 text-primary" />
            Privacy & Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your certificate wallet and how long data is
            retained.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Visibility Toggle */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <Label className="text-base font-medium">
                  Make Wallet Public
                </Label>
                <p className="text-sm leading-6 text-muted-foreground">
                  Allow anyone with your wallet link to view, download, and share
                  your certificates.
                </p>
                {privacy.walletSlug ? (
                  <p className="text-xs text-muted-foreground">
                    Public link:{" "}
                    <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono">
                      /wallet/{privacy.walletSlug}
                    </code>
                  </p>
                ) : null}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3">
                {isPublic ? (
                  <Globe2 className="size-5 text-emerald-600" />
                ) : (
                  <Lock className="size-5 text-muted-foreground" />
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPublic}
                  onClick={() => setIsPublic((prev) => !prev)}
                  disabled={!privacy.supportsVisibilityToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isPublic ? "bg-emerald-600" : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none block size-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
                      isPublic ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            </div>
            {!privacy.supportsVisibilityToggle ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Visibility cannot be saved until a wallet_is_public column is
                available on the users table.
              </p>
            ) : null}
          </div>

          {/* Data Retention */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Data Retention</Label>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose how long generated certificate data and email logs are kept
              before automatic cleanup.
            </p>
            <Select value={retention} onValueChange={setRetention}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="forever">Keep forever</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Save Privacy Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
