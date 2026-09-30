import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceSettingsClient } from "./client";
import type { WorkspaceMemberWithProfile, Profile, WorkspaceMember } from "@/types/database";

interface MemberRow extends WorkspaceMember {
  profiles: Pick<Profile, "email" | "full_name"> | null;
}

interface WorkspaceName {
  name: string;
}

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cookieStore = await cookies();
  const workspaceId = cookieStore.get("workspace_id")?.value;

  if (!workspaceId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No workspace selected. Switch to a workspace using the sidebar.
        </p>
      </div>
    );
  }

  // Fetch workspace details
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single<WorkspaceName>();

  if (!workspace) {
    redirect("/dashboard");
  }

  // Fetch members with profiles
  const { data: membersRaw } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, joined_at, profiles(email, full_name)")
    .eq("workspace_id", workspaceId);

  const members: WorkspaceMemberWithProfile[] = ((membersRaw ?? []) as unknown as MemberRow[]).map((m) => ({
    id: m.id,
    workspace_id: m.workspace_id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    profiles: m.profiles ?? { email: "", full_name: null },
  }));

  // Get current user's role in this workspace
  const currentMember = members.find((m) => m.user_id === user.id);
  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Workspace Settings
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage members and settings for{" "}
          <span className="font-medium">{workspace.name}</span>
        </p>
      </div>

      <WorkspaceSettingsClient
        workspaceId={workspaceId}
        members={members}
        isOwnerOrAdmin={isOwnerOrAdmin}
        currentUserId={user.id}
      />
    </div>
  );
}
