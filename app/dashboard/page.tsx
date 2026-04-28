import Link from "next/link";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  Plus,
  ArrowRight,
  Trash2,
} from "lucide-react";

import { deleteBatchAction } from "@/app/dashboard/actions";
import { DashboardRealtimeBridge } from "@/components/dashboard/dashboard-realtime-bridge";
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
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard — CertiDraft AI",
  description: "Manage your certificates, projects, and batches.",
};

export default async function DashboardPage() {
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

  const stats = [
    {
      title: "Total Certificates",
      value: dashboard.stats.totalCertificates,
      description: "All completed certificates",
      icon: <BarChart3 className="size-5 text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Batches Completed",
      value: dashboard.stats.batchesCompleted,
      description: "Successful generation runs",
      icon: <FolderKanban className="size-5 text-emerald-600" />,
      bgColor: "bg-emerald-50",
    },
    {
      title: "This Month",
      value: dashboard.stats.certificatesThisMonth,
      description: "Generated since the 1st",
      icon: <FileSpreadsheet className="size-5 text-purple-600" />,
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardRealtimeBridge />

      {/* Welcome Section */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.03] px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {dashboard.greetingName}! 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track your certificate batches, manage projects, and generate
              professional certificates in minutes.
            </p>
          </div>
          <Button size="lg" className="gap-2 shadow-md shadow-primary/20" asChild>
            <Link href="/dashboard/projects">
              <Plus className="size-5" />
              Create New Certificate
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="border-border/50 transition-shadow duration-200 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
              <div>
                <CardDescription className="text-sm font-medium">
                  {stat.title}
                </CardDescription>
                <CardTitle className="mt-2 text-3xl font-bold tabular-nums">
                  {new Intl.NumberFormat("en-US").format(stat.value)}
                </CardTitle>
              </div>
              <div className={`rounded-xl ${stat.bgColor} p-3`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Batches */}
      <section>
        <Card className="border-border/50">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Your Recent Projects</CardTitle>
              <CardDescription>
                Real-time progress from your latest generation runs.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href="/dashboard/projects">
                View All
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {dashboard.recentBatches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border/60 px-4 py-3">
                        Batch Name
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
                        Status
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
                        Date
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
                        Progress
                      </th>
                      <th className="border-b border-border/60 px-4 py-3">
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
                          <div className="font-medium">{batch.name}</div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {batch.certificateCount} certificate
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
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
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
                            <span className="text-xs text-muted-foreground">
                              {batch.processedCount}/
                              {batch.totalCount || batch.certificateCount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="border-b border-border/40 px-4 py-4">
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" asChild>
                              <Link href="/dashboard/projects">View</Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                href={`/api/batch-jobs/${batch.id}/download`}
                              >
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
              <div className="rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <FolderKanban className="size-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">No projects yet</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Create your first project to start generating certificates.
                </p>
                <Button className="mt-5 gap-2" asChild>
                  <Link href="/dashboard/projects">
                    <Plus className="size-4" />
                    Create First Project
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
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "Pending";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(parsed);
}
