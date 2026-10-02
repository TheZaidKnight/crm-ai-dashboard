-- ==============================================================================
-- Migration 0003: Fix Workspace Auto-Creation & Admin Role Management
-- ==============================================================================

-- 1. Fix RLS policies on workspace_members
-- Drop the overly restrictive policy that caused circular dependency on initial owner insertion
DROP POLICY IF EXISTS "Owners and admins can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Members can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;
DROP POLICY IF EXISTS "Creators can insert initial workspace membership" ON workspace_members;

-- 1a. Allow users to view memberships: either their own, or members of workspaces they belong to
CREATE POLICY "Users can view their own memberships" ON workspace_members
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid()
        )
    );

-- 1b. Allow workspace creators to insert their own initial 'owner' row
CREATE POLICY "Creators can insert initial workspace membership" ON workspace_members
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND role = 'owner'
        AND EXISTS (
            SELECT 1 FROM workspaces w
            WHERE w.id = workspace_members.workspace_id
            AND (w.created_by = auth.uid() OR w.created_by IS NULL)
        )
    );

-- 1c. Allow owners and admins to manage other members (invite, update role, remove)
CREATE POLICY "Owners and admins can manage members" ON workspace_members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id 
            AND wm.user_id = auth.uid() 
            AND wm.role IN ('owner', 'admin')
        )
    );

-- 2. Ensure RLS on profiles allows admins to update any user's role
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Robust trigger function for automatic profile + default workspace creation on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
    workspace_name TEXT;
BEGIN
    -- Determine workspace name from metadata or email
    workspace_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
        'My'
    ) || '''s Workspace';

    -- 3a. Upsert profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'customer'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

    -- 3b. Create default workspace if user doesn't already have one
    IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = NEW.id) THEN
        INSERT INTO public.workspaces (name, created_by)
        VALUES (workspace_name, NEW.id)
        RETURNING id INTO new_workspace_id;

        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (new_workspace_id, NEW.id, 'owner')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent trigger failure from breaking auth sign up
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure trigger is bound to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Helper procedure to easily promote a user to admin by email
CREATE OR REPLACE FUNCTION promote_user_to_admin(target_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE email = LOWER(TRIM(target_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Backfill: create default workspace for any existing user who lacks one
DO $$
DECLARE
    u RECORD;
    new_ws_id UUID;
    ws_name TEXT;
BEGIN
    FOR u IN 
        SELECT p.id, p.email, p.full_name 
        FROM public.profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.workspace_members wm WHERE wm.user_id = p.id
        )
    LOOP
        ws_name := COALESCE(
            NULLIF(TRIM(u.full_name), ''),
            NULLIF(TRIM(split_part(u.email, '@', 1)), ''),
            'My'
        ) || '''s Workspace';

        INSERT INTO public.workspaces (name, created_by)
        VALUES (ws_name, u.id)
        RETURNING id INTO new_ws_id;

        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (new_ws_id, u.id, 'owner')
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;
