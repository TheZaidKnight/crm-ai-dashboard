import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { StatsCard, StatsGrid } from "@/components/dashboard/stats-cards";
import { AdminTables } from "./client";
import { UnauthorizedView } from "@/components/admin/unauthorized-view";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check user profile for admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<Pick<Profile, "role">>();

  const currentRole = profile?.role ?? "customer";

  // If user is not an admin, render the provisioning / unauthorized interface
  if (currentRole !== "admin") {
    const { count: adminCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");

    const canBootstrap =
      (adminCount ?? 0) === 0 || process.env.NODE_ENV === "development";

    return (
      <UnauthorizedView
        userEmail={user.email ?? ""}
        currentRole={currentRole}
        canBootstrap={canBootstrap}
      />
    );
  }

  // User is an ADMIN: fetch system-wide stats
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
        <div className="flex items-center gap-2">
          <span className="rounded bg-purple-100 px-2.5 py-0.5 text-xs font-semibold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            System Administration
          </span>
        </div>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          System-wide overview, user management, and workspace administration
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
          title="Admin Status"
          value="Super Admin"
          description={user.email ?? ""}
          icon="🛡️"
        />
      </StatsGrid>

      <AdminTables
        users={(allUsers ?? []) as Record<string, unknown>[]}
        workspaces={(allWorkspaces ?? []) as Record<string, unknown>[]}
        currentUserId={user.id}
      />
    </div>
  );
}
