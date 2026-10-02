-- ==============================================================================
-- Migration 0004: Fix Infinite Recursion in RLS Policies via SECURITY DEFINER Helpers
-- ==============================================================================

-- 1. Helper Functions (SECURITY DEFINER bypasses RLS, completely eliminating recursion)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_member(lookup_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = lookup_workspace_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_admin_or_owner(lookup_workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = lookup_workspace_id 
          AND user_id = auth.uid() 
          AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;


-- 2. Drop all conflicting policies that caused infinite recursion on PROFILES

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE TO authenticated
    USING (public.is_admin());


-- 3. Drop all conflicting policies on WORKSPACES and rebuild clean policies

DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Authenticated users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Admins have full access to workspaces" ON public.workspaces;

CREATE POLICY "workspaces_select_policy" ON public.workspaces
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() 
        OR public.is_workspace_member(id) 
        OR public.is_admin()
    );

CREATE POLICY "workspaces_insert_policy" ON public.workspaces
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "workspaces_update_policy" ON public.workspaces
    FOR UPDATE TO authenticated
    USING (
        created_by = auth.uid()
        OR public.is_workspace_admin_or_owner(id) 
        OR public.is_admin()
    )
    WITH CHECK (
        created_by = auth.uid()
        OR public.is_workspace_admin_or_owner(id) 
        OR public.is_admin()
    );

CREATE POLICY "workspaces_delete_policy" ON public.workspaces
    FOR DELETE TO authenticated
    USING (
        created_by = auth.uid() 
        OR public.is_admin()
    );


-- 4. Drop all conflicting policies on WORKSPACE_MEMBERS and rebuild clean policies

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Creators can insert initial workspace membership" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins have full access to workspace_members" ON public.workspace_members;

CREATE POLICY "workspace_members_select_policy" ON public.workspace_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.is_workspace_member(workspace_id) 
        OR public.is_admin()
    );

CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        OR public.is_workspace_admin_or_owner(workspace_id) 
        OR public.is_admin()
    );

CREATE POLICY "workspace_members_update_policy" ON public.workspace_members
    FOR UPDATE TO authenticated
    USING (
        public.is_workspace_admin_or_owner(workspace_id) 
        OR public.is_admin()
    )
    WITH CHECK (
        public.is_workspace_admin_or_owner(workspace_id) 
        OR public.is_admin()
    );

CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members
    FOR DELETE TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.is_workspace_admin_or_owner(workspace_id) 
        OR public.is_admin()
    );


-- 5. Drop all conflicting policies on CUSTOMERS and rebuild clean policies

DROP POLICY IF EXISTS "Members can view workspace customers" ON public.customers;
DROP POLICY IF EXISTS "Members can create customers" ON public.customers;
DROP POLICY IF EXISTS "Members can update customers" ON public.customers;
DROP POLICY IF EXISTS "Owners/admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;

CREATE POLICY "customers_select_policy" ON public.customers
    FOR SELECT TO authenticated
    USING (
        public.is_workspace_member(workspace_id) 
        OR public.is_admin()
    );

CREATE POLICY "customers_insert_policy" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_workspace_member(workspace_id) 
        OR public.is_admin()
    );

CREATE POLICY "customers_update_policy" ON public.customers
    FOR UPDATE TO authenticated
    USING (
        public.is_workspace_member(workspace_id) 
        OR public.is_admin()
    )
    WITH CHECK (
        public.is_workspace_member(workspace_id) 
        OR public.is_admin()
    );

CREATE POLICY "customers_delete_policy" ON public.customers
    FOR DELETE TO authenticated
    USING (
        public.is_workspace_admin_or_owner(workspace_id) 
        OR public.is_admin()
    );


-- 6. Trigger function for new user signup (auto profile + default workspace)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_ws_id UUID;
    ws_name TEXT;
BEGIN
    ws_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
        NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
        'My'
    ) || '''s Workspace';

    -- Insert profile
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

    -- Create default workspace if none exists
    IF NOT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = NEW.id) THEN
        INSERT INTO public.workspaces (name, created_by)
        VALUES (ws_name, NEW.id)
        RETURNING id INTO new_ws_id;

        INSERT INTO public.workspace_members (workspace_id, user_id, role)
        VALUES (new_ws_id, NEW.id, 'owner')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user notice: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 7. Backfill: create default workspace for any existing user who currently has none

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
