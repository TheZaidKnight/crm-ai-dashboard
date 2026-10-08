import { createClient } from '@/lib/supabase/server';

export interface LogAuditEventParams {
  action: string;
  workspaceId?: string | null;
  userId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Server-side helper to record significant activity events into the audit_logs table.
 * Fails safely and gracefully so non-critical audit log issues never abort the primary transaction.
 */
export async function logAuditEvent({
  action,
  workspaceId = null,
  userId = null,
  details = {},
}: LogAuditEventParams): Promise<void> {
  try {
    const supabase = await createClient();

    // If userId was not passed, resolve automatically from current session
    let actorId = userId;
    if (!actorId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      actorId = user?.id ?? null;
    }

    const { error } = await supabase.from('audit_logs').insert({
      action: action.toUpperCase(),
      workspace_id: workspaceId,
      user_id: actorId,
      details: details ?? {},
    } as never);

    if (error) {
      console.warn(`[AUDIT_LOG_ERROR] Failed to record "${action}":`, error.message);
    }
  } catch (err) {
    console.warn(`[AUDIT_LOG_EXCEPTION] Unexpected error recording "${action}":`, err);
  }
}
