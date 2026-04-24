"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WalletCertificate, WalletData } from "@/lib/wallet";

type WalletClientProps = {
  wallet: WalletData;
};

export function WalletClient({ wallet }: WalletClientProps) {
  const [selectedCertificateId, setSelectedCertificateId] = useState(
    wallet.certificates[0]?.id ?? ""
  );

  const selectedCertificate = useMemo(
    () =>
      wallet.certificates.find(
        (certificate) => certificate.id === selectedCertificateId
      ) ?? wallet.certificates[0] ?? null,
    [selectedCertificateId, wallet.certificates]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border/60 bg-card px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Digital wallet</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {wallet.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {wallet.title}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
            {wallet.isPublic ? "Public wallet" : "Private wallet"}
          </div>
        </div>
      </section>

      {wallet.certificates.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="px-6 py-12 text-center">
            <h2 className="text-lg font-semibold">No certificates yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This wallet will show certificates here as soon as they are
              generated.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {wallet.certificates.map((certificate) => (
              <WalletCard
                key={certificate.id}
                certificate={certificate}
                isSelected={certificate.id === selectedCertificate?.id}
                onSelect={() => setSelectedCertificateId(certificate.id)}
              />
            ))}
          </div>

          {selectedCertificate ? (
            <Card className="border-border/60">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Certificate details
                    </p>
                    <CardTitle className="mt-1 text-2xl">
                      {selectedCertificate.recipientName}
                    </CardTitle>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700">
                    <ShieldCheck className="size-4" />
                    Verified
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 py-6">
                <DetailRow
                  label="Achievement"
                  value={selectedCertificate.achievement}
                />
                <DetailRow
                  label="Issue date"
                  value={formatDate(selectedCertificate.issueDate)}
                />
                <DetailRow label="Issuer" value={selectedCertificate.issuer} />
                <DetailRow
                  label="Verification"
                  value={selectedCertificate.verificationUrl}
                  asLink
                />

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild>
                    <a href={selectedCertificate.downloadPath}>
                      <Download className="size-4" />
                      Download PDF
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={buildLinkedInShareUrl(selectedCertificate)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      LinkedIn
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={buildTwitterShareUrl(selectedCertificate)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Twitter
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={buildEmailShareUrl(selectedCertificate)}>
                      Email
                      <Mail className="size-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}

      {wallet.canEdit ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
          Manage wallet visibility and your public slug in{" "}
          <Link href="/settings" className="font-medium text-primary underline-offset-4 hover:underline">
            settings
          </Link>
          .
        </div>
      ) : null}
    </div>
  );
}

function WalletCard({
  certificate,
  isSelected,
  onSelect,
}: {
  certificate: WalletCertificate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-3xl border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md ${
        isSelected ? "border-primary/50 ring-2 ring-primary/10" : "border-border/60"
      }`}
    >
      <div className="flex h-40 items-end rounded-t-3xl bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(37,99,235,0.85))] p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white backdrop-blur">
          {certificate.thumbnailLabel}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {certificate.recipientName}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {certificate.achievement}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatDate(certificate.issueDate)}</span>
          <span>{certificate.issuer}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a
              href={certificate.downloadPath}
              onClick={(event) => event.stopPropagation()}
            >
              <Download className="size-4" />
              Download PDF
            </a>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a
              href={certificate.verificationUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              View verification
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </button>
  );
}

function DetailRow({
  label,
  value,
  asLink = false,
}: {
  label: string;
  value: string;
  asLink?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {asLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="mt-2 text-base font-semibold leading-7 text-foreground">
          {value}
        </p>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || "No issue date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(parsed);
}

function buildLinkedInShareUrl(certificate: WalletCertificate) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    certificate.verificationUrl
  )}`;
}

function buildTwitterShareUrl(certificate: WalletCertificate) {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    certificate.verificationUrl
  )}&text=${encodeURIComponent(
    `Verified certificate for ${certificate.recipientName}`
  )}`;
}

function buildEmailShareUrl(certificate: WalletCertificate) {
  return `mailto:?subject=${encodeURIComponent(
    `Certificate for ${certificate.recipientName}`
  )}&body=${encodeURIComponent(
    `View this certificate: ${certificate.verificationUrl}`
  )}`;
}
