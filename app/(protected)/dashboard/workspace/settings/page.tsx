import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkspaceSettingsClient } from "./client";
import { ensureUserWorkspace } from "@/lib/supabase/workspace-provision";
import type { WorkspaceMemberWithProfile, Profile, WorkspaceMember } from "@/types/database";

interface MemberRow extends WorkspaceMember {
  profiles: Pick<Profile, "email" | "full_name"> | null;
}

interface WorkspaceName {
  id: string;
  name: string;
}

interface UserMembershipRow {
  workspace_id: string;
  role: string;
  workspaces: { id: string; name: string } | null;
}

export default async function WorkspaceSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const cookieStore = await cookies();
  let workspaceId = cookieStore.get("workspace_id")?.value;

  // Query user's workspace memberships
  const { data: userMembershipsRaw } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, created_by, created_at, updated_at)")
    .eq("user_id", user.id);

  const memberships = (userMembershipsRaw ?? []) as unknown as UserMembershipRow[];

  // If no workspaces exist, auto-provision default workspace
  if (memberships.length === 0) {
    const provisioned = await ensureUserWorkspace(supabase, user);
    if (provisioned.length > 0) {
      workspaceId = provisioned[0].id;
    }
  } else {
    // Check if workspaceId from cookie is valid for this user
    const matched = memberships.find((m) => m.workspace_id === workspaceId);
    if (!matched || !workspaceId) {
      workspaceId = memberships[0].workspace_id;
    }
  }

  // Fetch workspace details safely
  let workspace: WorkspaceName | null = null;
  if (workspaceId) {
    const { data: wsData } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", workspaceId)
      .maybeSingle<WorkspaceName>();
    workspace = wsData;
  }

  // Fallback to membership workspace info if query didn't return
  if (!workspace && memberships.length > 0 && memberships[0].workspaces) {
    workspace = memberships[0].workspaces;
    workspaceId = memberships[0].workspace_id;
  }

  if (!workspace || !workspaceId) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No active workspace could be found. Please select or create a workspace to view settings.
        </p>
      </div>
    );
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
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300">
          Organization Settings
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Workspace Settings
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage team members, permissions, and roles for{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-200">{workspace.name}</span>
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
