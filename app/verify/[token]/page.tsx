import {
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  Share2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  createClient,
  hasSupabaseServerEnv,
} from "@/lib/supabase/server";

export const metadata = {
  title: "Certificate Verification — CertiDraft AI",
  description: "Verify the authenticity of a CertiDraft certificate.",
};

interface VerifyPageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { token } = await params;

  let certificate: Record<string, unknown> | null = null;

  if (hasSupabaseServerEnv()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .eq("verification_token", token)
      .maybeSingle();
    certificate = data as Record<string, unknown> | null;
  }

  if (!certificate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle className="size-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Certificate Not Found
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            This verification link is invalid or the certificate has been
            removed.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const recipientName = String(certificate.recipient_name || "Recipient");
  const achievement = String(
    certificate.achievement || certificate.citation || "Achievement"
  );
  const issueDate = certificate.issued_at
    ? new Date(String(certificate.issued_at)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";
  const organization = String(
    certificate.organization || "CertiDraft"
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      {/* Back button */}
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" size="sm" className="mb-4 gap-1.5 text-gray-500" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Certificate card */}
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-2xl border bg-white shadow-xl">
          {/* Verified badge */}
          <div className="absolute right-6 top-6 z-10 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <CheckCircle className="size-4" />
            Verified
          </div>

          {/* Certificate content — A4-like aspect ratio */}
          <div className="flex aspect-[210/160] flex-col items-center justify-center p-8 sm:p-12 md:p-16">
            {/* Decorative border */}
            <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 p-8">
              {/* Organization */}
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
                {organization}
              </p>

              {/* Title */}
              <h2 className="mt-4 text-center text-lg font-semibold uppercase tracking-widest text-gray-500">
                Certificate of Achievement
              </h2>

              {/* Divider */}
              <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-blue-400 to-transparent" />

              {/* Presented to */}
              <p className="mt-6 text-sm text-gray-500">
                This is proudly presented to
              </p>

              {/* Recipient */}
              <h1 className="mt-3 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
                {recipientName}
              </h1>

              {/* Achievement */}
              <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-gray-600 italic">
                {achievement}
              </p>

              {/* Date */}
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="size-4" />
                {issueDate}
              </div>
            </div>
          </div>
        </div>

        {/* Verification info */}
        <div className="mt-6 rounded-xl border bg-white p-6 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 text-emerald-700">
            <CheckCircle className="size-5" />
            <span className="font-semibold">
              This certificate is authentic and verified
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Verified by CertiDraft AI on{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          {/* Share buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="size-3.5" />
              Share on LinkedIn
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="size-3.5" />
              Share on Twitter
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 className="size-3.5" />
              Share via Email
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
