-- ==============================================================================
-- Migration 0005: Activity Audit Logs Table and Policies
-- ==============================================================================

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Non-recursive RLS Policies using existing SECURITY DEFINER helpers
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete_policy" ON public.audit_logs;

-- Admins can view all audit logs.
-- Workspace members can view audit logs for workspaces they belong to.
-- Users can view audit logs where they were the actor.
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
        OR (user_id = auth.uid())
    );

-- Any authenticated user can append an audit log entry for their own action or if admin.
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR user_id IS NULL
        OR public.is_admin()
    );

-- Audit logs are append-only. Only system admins can purge or delete audit logs.
CREATE POLICY "audit_logs_delete_policy" ON public.audit_logs
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- 4. Create performance indexes for quick queries, filtering, and sorting
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
