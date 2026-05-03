import { Users, UserPlus, Shield, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createClient,
  hasSupabaseServerEnv,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Team Members — CertiDraft AI",
  description: "Manage your team and collaborate on certificate projects.",
};

export default async function TeamPage() {
  if (!hasSupabaseServerEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check subscription tier
  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .maybeSingle();

  const isPro = profile?.subscription_tier === "pro" || profile?.subscription_tier === "enterprise";

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
            <p className="mt-1 text-muted-foreground">
              Collaborate with your team on certificate templates and projects.
            </p>
          </div>
        </div>
        {isPro && (
          <Button className="gap-2">
            <UserPlus className="size-4" />
            Invite Member
          </Button>
        )}
      </section>

      {!isPro ? (
        /* Upgrade Prompt for Free Users */
        <section>
          <Card className="border-2 border-dashed border-primary/20 bg-primary/[0.01]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                <Crown className="size-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Unlock Team Collaboration</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Collaborate with up to 5 team members, share templates, and manage roles with a Pro subscription.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                  <Link href="/dashboard/subscription">
                    Upgrade to Pro
                    <Crown className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline">
                  Schedule a Demo
                </Button>
              </div>
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl">
                <div className="space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Shield className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Role Management</h3>
                  <p className="text-xs text-muted-foreground">Assign Admin or Editor roles to your team.</p>
                </div>
                <div className="space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Users className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Shared Templates</h3>
                  <p className="text-xs text-muted-foreground">Collaborate on certificate designs in real-time.</p>
                </div>
                <div className="space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Lock className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">Granular Access</h3>
                  <p className="text-xs text-muted-foreground">Control who can generate or download certificates.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : (
        /* Team Management UI for Pro Users */
        <section>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
              <CardDescription>
                Manage members and their permissions within your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="border-b border-border/60 px-4 py-3">Member</th>
                      <th className="border-b border-border/60 px-4 py-3">Role</th>
                      <th className="border-b border-border/60 px-4 py-3">Status</th>
                      <th className="border-b border-border/60 px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="group hover:bg-muted/30 transition-colors">
                      <td className="border-b border-border/40 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {user.email?.[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.user_metadata?.full_name || "You"}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-border/40 px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary uppercase tracking-wider">
                          Owner
                        </span>
                      </td>
                      <td className="border-b border-border/40 px-4 py-4 text-sm text-emerald-600 font-medium">
                        Active
                      </td>
                      <td className="border-b border-border/40 px-4 py-4 text-right">
                        <Button variant="ghost" size="sm">Manage</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
