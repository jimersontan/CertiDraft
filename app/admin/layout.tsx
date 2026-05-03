import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";

export default async function AdminLayout({
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

  const adminEmail = user.email?.toLowerCase().trim();
  const isFallbackAdmin = adminEmail === 'admin@certidraft.com';
  
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = isFallbackAdmin || profile?.role === "admin" || profile?.role === "super_admin";

  if (!isAdmin) {
    console.log(`[AdminLayout] Access denied for ${adminEmail}. Redirecting to dashboard.`);
    redirect("/dashboard");
  }

  const adminName = profile?.full_name || user.user_metadata?.full_name || "Admin";

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar adminName={adminName} adminEmail={user.email || ""} />
      <main className="min-h-screen pt-14 lg:pl-[240px] lg:pt-0">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
