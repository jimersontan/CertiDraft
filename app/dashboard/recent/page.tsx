import { redirect } from "next/navigation";
import { Clock, FolderKanban, ArrowRight, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard";
import {
  createClient,
  hasSupabaseServerEnv,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/server";
import { deleteBatchAction } from "@/app/dashboard/actions";

export const metadata = {
  title: "Recent Activity — CertiDraft AI",
  description: "View your recent certificate generation activity.",
};

export default async function RecentActivityPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {SUPABASE_CONFIG_ERROR}
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const dashboard = await getDashboardData({
    userId: user.id,
    email: user.email,
    fallbackName: user.user_metadata?.full_name,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recent Activity</h1>
            <p className="mt-1 text-muted-foreground">
              A history of your latest certificate generation projects and batches.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Batches List */}
      <section>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Generation History</CardTitle>
            <CardDescription>
              Real-time progress and history of your latest certificate runs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentBatches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border/60 px-4 py-3">
                        Batch / Project
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
                        Status
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
                        Date
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
                        Completion
                      </th>
                      <th className="border-b border-border/60 px-4 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentBatches.map((batch) => (
                      <tr
                        key={batch.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="border-b border-border/40 px-4 py-4">
                          <div className="font-medium text-foreground">{batch.name}</div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {batch.certificateCount} total certificate
                            {batch.certificateCount === 1 ? "" : "s"}
                          </p>
                        </td>
                        <td className="border-b border-border/40 px-4 py-4">
                          <StatusBadge status={batch.status} />
                        </td>
                        <td className="border-b border-border/40 px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(batch.completedAt || batch.createdAt)}
                        </td>
                        <td className="border-b border-border/40 px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    ((batch.processedCount || 0) /
                                      Math.max(
                                        1,
                                        batch.totalCount ||
                                          batch.certificateCount ||
                                          1
                                      )) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums">
                              {Math.round(
                                ((batch.processedCount || 0) /
                                  Math.max(
                                    1,
                                    batch.totalCount ||
                                      batch.certificateCount ||
                                      1
                                  )) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-border/40 px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href="/dashboard/projects" className="gap-1.5">
                                <ArrowRight className="size-3.5" />
                                Details
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                href={`/api/batch-jobs/${batch.id}/download`}
                                className="gap-1.5"
                              >
                                <Download className="size-3.5" />
                                Download
                              </Link>
                            </Button>
                            <form action={deleteBatchAction}>
                              <input
                                type="hidden"
                                name="batch_job_id"
                                value={batch.id}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                type="submit"
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Clock className="size-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">No recent activity</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Your certificate generation history will appear here.
                </p>
                <Button className="mt-6 gap-2" asChild>
                  <Link href="/dashboard/projects">
                    Create New Project
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const classes =
    normalized === "completed" || normalized === "completed_with_errors"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "failed"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "Pending";
  return new Intl.DateTimeFormat("en-US", { 
    dateStyle: "medium",
    timeStyle: "short" 
  }).format(parsed);
}
