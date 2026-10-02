'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole, Profile } from '@/types/database';

export interface AdminActionResult {
  error: string | null;
  success?: string | null;
}

/**
 * Updates a user's system role (customer or admin).
 * Protected by checking that the caller is an admin.
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  // Verify caller is admin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<Profile, 'role'>>();

  if (callerProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can change user roles.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole } as never)
    .eq('id', userId);

  if (error) {
    console.error('Update user role failed:', error.message);
    return { error: error.message };
  }

  revalidatePath('/admin');
  return { error: null, success: `User role updated to ${newRole}.` };
}

/**
 * Allows the initial user (or dev user when 0 admins exist) to claim the admin role.
 * Solves the bootstrapping problem without requiring direct database access.
 */
export async function claimInitialAdminRole(): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  // Count existing admins
  const { count: adminCount, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  if (countError) {
    console.error('Failed to count admins:', countError.message);
    return { error: countError.message };
  }

  // Allow if 0 admins exist, or in development mode
  const canBootstrap = (adminCount ?? 0) === 0 || process.env.NODE_ENV === 'development';

  if (!canBootstrap) {
    return {
      error:
        'Admin bootstrap is disabled because an admin already exists in the system. An existing admin must grant you access.',
    };
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' as UserRole } as never)
    .eq('id', user.id);

  if (updateError) {
    console.error('Failed to claim admin role:', updateError.message);
    return { error: updateError.message };
  }

  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { error: null, success: 'Congratulations! You are now an Admin.' };
}

/**
 * Promotes a user to admin by email.
 */
export async function promoteUserByEmail(
  _prevState: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated.' };
  }

  // Check caller role
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<Profile, 'role'>>();

  if (callerProfile?.role !== 'admin') {
    return { error: 'Unauthorized: Only admins can promote users.' };
  }

  const targetEmail = formData.get('email') as string;
  if (!targetEmail || !targetEmail.trim()) {
    return { error: 'Email is required.' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' as UserRole } as never)
    .eq('email', targetEmail.trim().toLowerCase());

  if (error) {
    console.error('Promote user failed:', error.message);
    return { error: error.message };
  }

  revalidatePath('/admin');
  return { error: null, success: `User with email ${targetEmail} is now an Admin.` };
}
