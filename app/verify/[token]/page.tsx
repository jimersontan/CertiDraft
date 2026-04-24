import Link from "next/link";
import { CheckCircle2, ExternalLink, Mail, Share2 } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCertificateVerificationRecord } from "@/lib/certificates/verification";

export const dynamic = "force-dynamic";

type VerificationPageProps = {
  params: Promise<{ token: string }>;
};

export default async function VerificationPage({
  params,
}: VerificationPageProps) {
  const { token } = await params;

  let verificationRecord = null;
  let errorMessage = "";

  try {
    verificationRecord = await getCertificateVerificationRecord(token);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to verify this certificate right now.";
  }

  const shareUrl = buildVerificationUrl(token);
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl
  )}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent("Verified certificate from CertiDraft")}`;
  const emailShareUrl = `mailto:?subject=${encodeURIComponent(
    "Verified certificate"
  )}&body=${encodeURIComponent(`View this verified certificate: ${shareUrl}`)}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.10),_transparent_35%),linear-gradient(to_bottom,_rgba(15,23,42,0.02),_transparent_30%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700">
              <Share2 className="size-4" />
              Public certificate verification
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">
              Certificate Verification
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Scan the QR code or open a shared link to confirm that a
              certificate was issued through CertiDraft.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/">
              Back to Home
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Verification unavailable</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {!errorMessage && !verificationRecord ? (
          <Card className="border-destructive/20 bg-card/95">
            <CardHeader>
              <CardTitle>Certificate not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We could not find a certificate that matches this verification
                token.
              </p>
              <p>
                Please check the QR code or ask the issuer to share a valid
                verification link.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {verificationRecord ? (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <Card className="border-emerald-500/15 bg-card/95 shadow-sm">
              <CardHeader className="gap-4 border-b border-border/60 pb-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Verification status
                    </p>
                    <CardTitle className="mt-1 text-3xl">
                      {verificationRecord.recipientName}
                    </CardTitle>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-base font-semibold text-emerald-700">
                    <CheckCircle2 className="size-5" />
                    {verificationRecord.statusLabel} ✓
                  </div>
                </div>

                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  {verificationRecord.message}
                </p>
              </CardHeader>

              <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
                <DetailCard
                  label="Recipient name"
                  value={verificationRecord.recipientName}
                />
                <DetailCard
                  label="Achievement"
                  value={verificationRecord.achievement}
                />
                <DetailCard
                  label="Issue date"
                  value={formatDateTime(verificationRecord.issueDate, false)}
                />
                <DetailCard
                  label="Issuing organization"
                  value={verificationRecord.organizationName}
                />
                <DetailCard
                  label="Verification timestamp"
                  value={formatDateTime(
                    verificationRecord.verificationTimestamp,
                    true
                  )}
                />
                <DetailCard label="Verification token" value={verificationRecord.token} />
              </CardContent>
            </Card>

            <Card className="bg-card/95">
              <CardHeader>
                <CardTitle className="text-xl">Share</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" asChild>
                  <a
                    href={linkedInShareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Twitter
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href={emailShareUrl}>
                    Email
                    <Mail className="size-4" />
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="ghost" asChild>
                  <a href={shareUrl}>
                    Open verification link
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <p className="pt-2 text-xs leading-6 text-muted-foreground">
                  Share this verification link with employers, institutions, or
                  event organizers who need to confirm authenticity.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold leading-7 text-foreground">
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value: string, includeTime: boolean) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
  }).format(parsed);
}

function buildVerificationUrl(token: string) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://certidraft.com";
  return `${siteUrl.replace(/\/+$/, "")}/verify/${encodeURIComponent(token)}`;
}
