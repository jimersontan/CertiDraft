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

  // Admin access check
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin" || user.email === "admin@certidraft.com"; 

  if (!isAdmin) {
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
