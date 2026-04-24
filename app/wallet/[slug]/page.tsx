import Link from "next/link";
import { LockKeyhole, Settings2, Wallet } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WalletClient } from "@/components/wallet/wallet-client";
import { getWalletDataBySlug } from "@/lib/wallet";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type WalletPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function WalletPage({ params }: WalletPageProps) {
  const { slug } = await params;

  let viewerUserId = "";
  if (hasSupabaseServerEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? "";
  }

  let wallet = null;
  let errorMessage = "";

  try {
    wallet = await getWalletDataBySlug({ slug, viewerUserId });
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load this wallet right now.";
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_35%),linear-gradient(to_bottom,_rgba(15,23,42,0.03),_transparent_30%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              <Wallet className="size-4" />
              Certificate wallet
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight">
              CertiDraft Wallet
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              View certificates, download PDFs, and share verified achievements
              from one clean wallet page.
            </p>
          </div>

          <Button variant="outline" asChild>
            <Link href="/settings">
              <Settings2 className="size-4" />
              Wallet Settings
            </Link>
          </Button>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Wallet unavailable</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {!errorMessage && !wallet ? (
          <Alert variant="destructive">
            <AlertTitle>Wallet not found</AlertTitle>
            <AlertDescription>
              We could not find a certificate wallet for this link.
            </AlertDescription>
          </Alert>
        ) : null}

        {wallet && !wallet.isAccessible ? (
          <div className="rounded-3xl border border-border/60 bg-card px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted">
              <LockKeyhole className="size-6 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">This wallet is private</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              The wallet owner has not made this certificate collection public
              yet. Ask them to share a public link or enable public access in
              settings.
            </p>
          </div>
        ) : null}

        {wallet && wallet.isAccessible ? <WalletClient wallet={wallet} /> : null}
      </div>
    </main>
  );
}
