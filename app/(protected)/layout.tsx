import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Sidebar } from "@/components/dashboard/sidebar";
import type { WorkspaceWithRole, WorkspaceRole } from "@/types/database";

interface MembershipRow {
  role: WorkspaceRole;
  workspaces: {
    id: string;
    name: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's workspaces with their role
  const { data: membershipsRaw } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, created_by, created_at, updated_at)")
    .eq("user_id", user.id);

  const memberships = (membershipsRaw ?? []) as unknown as MembershipRow[];

  const workspaces: WorkspaceWithRole[] = memberships
    .filter((m) => m.workspaces)
    .map((m) => ({
      ...m.workspaces!,
      workspace_members: [{ role: m.role }],
    }));

  // Determine current workspace from cookie or default to first
  const cookieStore = await cookies();
  const savedWorkspaceId = cookieStore.get("workspace_id")?.value;
  const currentWorkspaceId =
    workspaces.find((w) => w.id === savedWorkspaceId)?.id ??
    workspaces[0]?.id ??
    "";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        userEmail={user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
