import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { StatsCard, StatsGrid } from "@/components/dashboard/stats-cards";

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
  const workspaceId = cookieStore.get("workspace_id")?.value;

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
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {workspaceName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {user?.email}
        </p>
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

      {/* Quick info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Getting Started
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This is your workspace dashboard. Use the sidebar to navigate to
          Forecasting for AI-powered revenue predictions, or Workspace Settings
          to manage members. Add customers via the Supabase dashboard or API to
          see live statistics.
        </p>
      </div>
    </div>
  );
}
