import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { StatsCard, StatsGrid } from "@/components/dashboard/stats-cards";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CustomerRevenue {
  revenue: number | string | null;
}

interface WorkspaceName {
  name: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current workspace from cookie
  const cookieStore = await cookies();
  let workspaceId = cookieStore.get("workspace_id")?.value;

  if (!workspaceId && user) {
    const { data: memberWs } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle<{ workspace_id: string }>();
    if (memberWs?.workspace_id) {
      workspaceId = memberWs.workspace_id;
    }
  }

  // Fetch workspace stats
  let customerCount = 0;
  let totalRevenue = 0;
  let activeCustomers = 0;
  let leads = 0;
  let workspaceName = "Your Workspace";

  if (workspaceId) {
    const [
      { count: custCount },
      { data: revenueData },
      { count: activeCount },
      { count: leadCount },
      { data: wsData },
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("customers")
        .select("revenue")
        .eq("workspace_id", workspaceId)
        .then((res) => ({
          ...res,
          data: res.data as CustomerRevenue[] | null,
        })),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "active"),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("status", "lead"),
      supabase
        .from("workspaces")
        .select("name")
        .eq("id", workspaceId)
        .single<WorkspaceName>(),
    ]);

    customerCount = custCount ?? 0;
    totalRevenue =
      revenueData?.reduce(
        (sum, c) => sum + (typeof c.revenue === "number" ? c.revenue : parseFloat(String(c.revenue)) || 0),
        0
      ) ?? 0;
    activeCustomers = activeCount ?? 0;
    leads = leadCount ?? 0;
    workspaceName = wsData?.name ?? workspaceName;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Active Workspace
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {workspaceName}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Welcome back, <span className="font-medium text-zinc-700 dark:text-zinc-300">{user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <Link href="/dashboard/forecasting">
            <Button variant="secondary" size="sm">
              View AI Forecast
            </Button>
          </Link>
          <Link href="/dashboard/workspace/settings">
            <Button size="sm">
              Manage Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsGrid>
        <StatsCard
          title="Total Customers"
          value={customerCount}
          icon="👥"
        />
        <StatsCard
          title="Active Customers"
          value={activeCustomers}
          icon="✅"
        />
        <StatsCard
          title="Leads"
          value={leads}
          icon="🎯"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon="💰"
        />
      </StatsGrid>

      {/* Quick info & Guide */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 text-sm font-semibold">
                ✨
              </span>
              <div>
                <CardTitle>Getting Started with Nexus CRM</CardTitle>
                <CardDescription>
                  Your central intelligence hub for customer relationships & revenue insights
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
            <p className="leading-relaxed">
              This is your live workspace overview. Track your customer pipeline, invite teammates, and leverage machine learning forecasting models to project future growth.
            </p>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">🤖 AI Predictive Modeling</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Forecast next quarter&apos;s revenue based on customer volume, status changes, and historical run rate.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">👥 Multi-Tenant Access</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Switch between organizations seamlessly and invite team members with granular roles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Shortcut to key workspace tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <Link
              href="/dashboard/forecasting"
              className="group flex items-center justify-between rounded-xl border border-zinc-200/70 p-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
            >
              <span>Explore AI Forecast</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/dashboard/workspace/settings"
              className="group flex items-center justify-between rounded-xl border border-zinc-200/70 p-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
            >
              <span>Team & Members</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/admin"
              className="group flex items-center justify-between rounded-xl border border-zinc-200/70 p-3 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
            >
              <span>System Admin & Audit</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
