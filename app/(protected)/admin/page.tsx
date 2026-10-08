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
    { data: allAuditLogs },
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
    supabase
      .from("audit_logs")
      .select("id, workspace_id, user_id, action, details, created_at, profiles(email, full_name), workspaces(name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          System Administration
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Control Center
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          System-wide overview, user management, workspace administration, and security audit logs
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
        auditLogs={(allAuditLogs ?? []) as Record<string, unknown>[]}
        currentUserId={user.id}
      />
    </div>
  );
}
