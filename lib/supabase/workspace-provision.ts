import { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, WorkspaceWithRole, WorkspaceRole } from '@/types/database';

/**
 * Ensures that the authenticated user has a profile and at least one default workspace.
 * If no workspace exists for this user, one is created automatically.
 * Returns the list of workspaces with user roles.
 */
export async function ensureUserWorkspace(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<WorkspaceWithRole[]> {
  // 1. Check if user already has workspace memberships
  const { data: membershipsRaw } = await supabase
    .from('workspace_members')
    .select('role, workspaces(id, name, created_by, created_at, updated_at)')
    .eq('user_id', user.id);

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

  const memberships = (membershipsRaw ?? []) as unknown as MembershipRow[];

  const existingWorkspaces: WorkspaceWithRole[] = memberships
    .filter((m) => m.workspaces)
    .map((m) => ({
      ...m.workspaces!,
      workspace_members: [{ role: m.role }],
    }));

  if (existingWorkspaces.length > 0) {
    return existingWorkspaces;
  }

  // 2. If no workspace exists, ensure profile exists first
  const fullName = (user.user_metadata?.full_name as string) || '';
  const email = user.email || '';

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (!existingProfile) {
    await supabase.from('profiles').insert({
      id: user.id,
      email,
      full_name: fullName || null,
      role: 'customer',
    } as never);
  }

  // 3. Create default workspace
  const workspaceName =
    (fullName?.trim() || email.split('@')[0] || 'My') + "'s Workspace";

  const { data: newWorkspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({
      name: workspaceName,
      created_by: user.id,
    } as never)
    .select('id, name, created_by, created_at, updated_at')
    .single();

  if (wsError || !newWorkspace) {
    console.error('ensureUserWorkspace: failed to insert workspace:', wsError?.message);
    return [];
  }

  const typedWs = newWorkspace as unknown as {
    id: string;
    name: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };

  // 4. Insert initial owner membership
  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: typedWs.id,
    user_id: user.id,
    role: 'owner' as WorkspaceRole,
  } as never);

  if (memberError) {
    console.error('ensureUserWorkspace: failed to insert owner membership:', memberError.message);
  }

  return [
    {
      ...typedWs,
      workspace_members: [{ role: 'owner' }],
    },
  ];
}
