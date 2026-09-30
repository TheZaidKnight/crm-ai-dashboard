import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { StatsCard, StatsGrid } from "@/components/dashboard/stats-cards";
import { AdminTables } from "./client";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch system-wide stats (admin bypasses RLS)
  const [
    { count: totalUsers },
    { count: totalWorkspaces },
    { count: totalCustomers },
    { data: allUsers },
    { data: allWorkspaces },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("workspaces")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("workspaces")
      .select("id, name, created_by, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          System-wide overview and management
        </p>
      </div>

      <StatsGrid>
        <StatsCard title="Total Users" value={totalUsers ?? 0} icon="👤" />
        <StatsCard
          title="Total Workspaces"
          value={totalWorkspaces ?? 0}
          icon="🏢"
        />
        <StatsCard
          title="Total Customers"
          value={totalCustomers ?? 0}
          icon="👥"
        />
        <StatsCard
          title="Admin Access"
          value="Active"
          description={user.email ?? ""}
          icon="🔑"
        />
      </StatsGrid>

      <AdminTables
        users={(allUsers ?? []) as Record<string, unknown>[]}
        workspaces={(allWorkspaces ?? []) as Record<string, unknown>[]}
      />
    </div>
  );
}
