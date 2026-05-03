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
      title: "Current Plan",
      value: dashboard.plan.toUpperCase(),
      description: `Limit: ${dashboard.planLimit} certificates/mo`,
      icon: <Plus className="size-5 text-blue-600" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Monthly Usage",
      value: `${dashboard.usageCount} / ${dashboard.planLimit}`,
      description: `${Math.round((dashboard.usageCount / dashboard.planLimit) * 100)}% of limit used`,
      icon: <BarChart3 className="size-5 text-emerald-600" />,
      bgColor: "bg-emerald-50",
      usagePercent: Math.round((dashboard.usageCount / dashboard.planLimit) * 100),
    },
    {
      title: "Total Certificates",
      value: dashboard.stats.totalCertificates,
      description: "All time generated",
      icon: <FileSpreadsheet className="size-5 text-purple-600" />,
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardRealtimeBridge />

      {/* Welcome Section */}
      <section
        className="relative overflow-hidden rounded-2xl border border-slate-100 px-6 py-8 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #fafbff 100%)' }}
      >
        {/* Mesh blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-blue-100/40 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #6366f1 1px, transparent 0)', backgroundSize: '28px 28px' }} />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {dashboard.greetingName}! 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your certificate batches, manage projects, and generate professional certificates in minutes.
            </p>
          </div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-500/40"
          >
            <Plus className="size-5" />
            Create New Certificate
          </Link>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stat.title}</p>
                <p className="mt-2 font-sans text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                  {typeof stat.value === "number"
                    ? new Intl.NumberFormat("en-US").format(stat.value)
                    : stat.value}
                </p>
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </div>
            {typeof (stat as any).usagePercent === "number" && (
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      (stat as any).usagePercent >= 100 ? 'bg-red-500' :
                      (stat as any).usagePercent >= 80  ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min((stat as any).usagePercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">{stat.description}</p>
          </div>
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
              <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50/80 to-white px-6 py-16 text-center">
                {/* Ghost certificate outlines */}
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-4 overflow-hidden px-8 pb-4">
                  {[0.35, 0.2, 0.12].map((opacity, i) => (
                    <div
                      key={i}
                      className="h-28 max-w-[140px] flex-1 rounded-lg border-2 border-indigo-200 bg-indigo-50/60"
                      style={{ opacity, transform: `translateY(${(2 - i) * 12}px) scale(${0.92 + i * 0.04})` }}
                    >
                      <div className="m-2 h-2 w-3/4 rounded-full bg-indigo-200/60" />
                      <div className="mx-2 mt-1.5 h-1.5 w-1/2 rounded-full bg-indigo-100" />
                      <div className="mx-auto mt-3 h-3 w-2/3 rounded bg-indigo-100/60" />
                    </div>
                  ))}
                </div>

                <div className="relative z-10">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 ring-8 ring-indigo-50/50">
                    <FolderKanban className="size-7 text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">No projects yet</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500">
                    Create your first project to start generating beautiful certificates.
                  </p>
                  <Link
                    href="/dashboard/projects"
                    className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-300"
                  >
                    <Plus className="size-4" />
                    Create First Project
                  </Link>
                </div>
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
