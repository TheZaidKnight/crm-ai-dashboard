'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { WorkspaceRole, Workspace, WorkspaceMember, Profile } from '@/types/database';

export interface WorkspaceResult {
  error: string | null;
  success?: string | null;
}

export async function createWorkspace(
  _prevState: WorkspaceResult,
  formData: FormData
): Promise<WorkspaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  const name = formData.get('name') as string;

  if (!name || name.trim().length === 0) {
    return { error: 'Workspace name is required.' };
  }

  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .insert({ name: name.trim(), created_by: user.id } as never)
    .select('id')
    .single<Pick<Workspace, 'id'>>();

  if (wsError || !workspace) {
    console.error('Create workspace failed:', wsError?.message);
    return { error: wsError?.message ?? 'Failed to create workspace.' };
  }

  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'owner' as WorkspaceRole,
    } as never);

  if (memberError) {
    console.error('Add owner failed:', memberError.message);
    return { error: memberError.message };
  }

  revalidatePath('/dashboard');
  return { error: null, success: 'Workspace created successfully.' };
}

export async function inviteMember(
  _prevState: WorkspaceResult,
  formData: FormData
): Promise<WorkspaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  const workspaceId = formData.get('workspace_id') as string;
  const email = formData.get('email') as string;
  const role = (formData.get('role') as WorkspaceRole) || 'member';

  if (!email) {
    return { error: 'Email is required.' };
  }

  // Look up user by email in profiles
  const { data: targetProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single<Pick<Profile, 'id'>>();

  if (profileError || !targetProfile) {
    return { error: 'No user found with that email address.' };
  }

  const { error } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: targetProfile.id,
    role,
  } as never);

  if (error) {
    if (error.code === '23505') {
      return { error: 'This user is already a member of this workspace.' };
    }
    console.error('Invite member failed:', error.message);
    return { error: error.message };
  }

  revalidatePath('/dashboard/workspace/settings');
  return { error: null, success: `Invited ${email} as ${role}.` };
}

export async function removeMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  if (userId === user.id) {
    return { error: 'You cannot remove yourself from the workspace.' };
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    console.error('Remove member failed:', error.message);
    return { error: error.message };
  }

  revalidatePath('/dashboard/workspace/settings');
  return { error: null, success: 'Member removed.' };
}

export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  newRole: WorkspaceRole
): Promise<WorkspaceResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('workspace_members')
    .update({ role: newRole } as never)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) {
    console.error('Update role failed:', error.message);
    return { error: error.message };
  }

  revalidatePath('/dashboard/workspace/settings');
  return { error: null, success: `Role updated to ${newRole}.` };
}

export async function getUserWorkspaces() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name)')
    .eq('user_id', user.id);

  return data ?? [];
}
