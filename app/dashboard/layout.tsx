import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import {
  createClient,
  hasSupabaseServerEnv,
} from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseServerEnv()) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Try to get profile from users table
  let fullName = user.user_metadata?.full_name || "User";
  let subscriptionTier = "free";

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, plan, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    fullName = profile.full_name || fullName;
    subscriptionTier = profile.plan || subscriptionTier;
  }

      const adminEmail = user.email?.toLowerCase().trim();
      const isAdminUser = profile?.role === "admin" || profile?.role === "super_admin" || adminEmail === "admin@certidraft.com";
      
      return (
        <div className="min-h-screen bg-muted/30">
          <Sidebar
            userName={fullName}
            userEmail={user.email || ""}
            subscriptionTier={subscriptionTier}
            notificationCount={3}
            isAdmin={isAdminUser}
          />

      {/* Main content area — offset by sidebar width on desktop */}
      <main className="min-h-screen pt-14 lg:pl-[240px] lg:pt-0">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
