import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  Trash2,
  UserCircle2,
} from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { deleteBatchAction } from "@/app/dashboard/actions";
import { DashboardRealtimeBridge } from "@/components/dashboard/dashboard-realtime-bridge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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

export default async function DashboardPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <div className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Alert variant="destructive">
            <AlertTitle>Dashboard unavailable</AlertTitle>
            <AlertDescription>{SUPABASE_CONFIG_ERROR}</AlertDescription>
          </Alert>
        </div>
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
      title: "Total Certificates Generated",
      value: dashboard.stats.totalCertificates,
      description: "All completed certificates across your account",
      icon: <BarChart3 className="size-5 text-primary" />,
    },
    {
      title: "Batches Completed",
      value: dashboard.stats.batchesCompleted,
      description: "Successful runs ready to share and download",
      icon: <FolderKanban className="size-5 text-emerald-600" />,
    },
    {
      title: "Certificates This Month",
      value: dashboard.stats.certificatesThisMonth,
      description: "New certificates generated since the first of the month",
      icon: <FileSpreadsheet className="size-5 text-blue-600" />,
    },
  ];

  const sidebarItems = [
    {
      label: "Dashboard",
      href: "#overview",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      label: "Projects",
      href: "#projects",
      icon: <FolderKanban className="size-4" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="size-4" />,
    },
    {
      label: "Profile",
      href: "/settings",
      icon: <UserCircle2 className="size-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardRealtimeBridge />

      <header className="border-b border-border/50 bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Welcome back, {dashboard.greetingName}
              </p>
              <h1 className="text-lg font-semibold tracking-tight">
                CertiDraft Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user.email}
            </span>
            <form action={signOut}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="size-4" />
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Navigation</CardTitle>
              <CardDescription>
                Jump between your dashboard sections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sidebarItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-8">
          <section
            id="overview"
            className="rounded-3xl border border-border/60 bg-card px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  Dashboard overview
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Welcome back, {dashboard.greetingName}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Track batch progress, review your latest certificate runs, and
                  jump into your next project without leaving this page.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/builder">
                    <Plus className="size-4" />
                    New Project
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/uploads">
                    <FileSpreadsheet className="size-4" />
                    Upload CSV
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/settings">
                    <Settings className="size-4" />
                    View Settings
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-border/50">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardDescription className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardDescription>
                    <CardTitle className="mt-3 text-3xl">
                      {formatNumber(stat.value)}
                    </CardTitle>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-3">{stat.icon}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section id="projects">
            <Card className="border-border/50">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle>Recent Batches</CardTitle>
                  <CardDescription>
                    Real-time progress from your latest generation runs.
                  </CardDescription>
                </div>
                <Button variant="outline" asChild>
                  <Link href="/uploads">Open uploads</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {dashboard.recentBatches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-separate border-spacing-0">
                      <thead>
                        <tr className="text-left text-sm text-muted-foreground">
                          <th className="border-b border-border/60 px-4 py-3 font-medium">
                            Batch name
                          </th>
                          <th className="border-b border-border/60 px-4 py-3 font-medium">
                            Status
                          </th>
                          <th className="border-b border-border/60 px-4 py-3 font-medium">
                            Date
                          </th>
                          <th className="border-b border-border/60 px-4 py-3 font-medium">
                            Progress
                          </th>
                          <th className="border-b border-border/60 px-4 py-3 font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.recentBatches.map((batch) => (
                          <tr key={batch.id} className="align-top">
                            <td className="border-b border-border/40 px-4 py-4">
                              <div className="font-medium text-foreground">
                                {batch.name}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
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
                            <td className="border-b border-border/40 px-4 py-4 text-sm text-muted-foreground">
                              {batch.processedCount}/{batch.totalCount || batch.certificateCount || 0}
                            </td>
                            <td className="border-b border-border/40 px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href="/uploads">View</Link>
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
                                  <Button size="sm" variant="ghost" type="submit">
                                    <Trash2 className="size-4" />
                                    Delete
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
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
                    <h3 className="text-base font-semibold">No recent batches yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Upload a CSV or start a new project to begin generating
                      certificates.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card id="settings" className="border-border/50">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>
                  Control your generation flow and project defaults.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Manage wallet visibility, organization details, and upload
                  preferences.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/settings">Open wallet settings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card id="profile" className="border-border/50">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Account details currently used for your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Name:</span>{" "}
                  {dashboard.profileName}
                </p>
                <p>
                  <span className="font-medium text-foreground">Email:</span>{" "}
                  {user.email}
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  const classes =
    normalized === "completed" || normalized === "completed_with_errors"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
      : normalized === "failed"
        ? "border-destructive/20 bg-destructive/10 text-destructive"
        : "border-amber-500/20 bg-amber-500/10 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value || "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(parsed);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
