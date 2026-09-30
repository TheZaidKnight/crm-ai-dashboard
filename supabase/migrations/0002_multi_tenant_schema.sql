-- 1a. Create workspace_role enum
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

-- 1b. Create workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1c. Create workspace_members join table
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- 1d. Create customers table (workspace-scoped CRM data)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead')),
    revenue NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. Enable RLS on all new tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 1f. RLS policies for workspaces
CREATE POLICY "Members can view their workspaces" ON workspaces
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid()));

CREATE POLICY "Owners can update workspace" ON workspaces
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Authenticated users can create workspaces" ON workspaces
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Owners can delete workspace" ON workspaces
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role = 'owner'));

-- 1g. RLS policies for workspace_members
CREATE POLICY "Members can view workspace members" ON workspace_members
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()));

CREATE POLICY "Owners and admins can manage members" ON workspace_members
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')))
    WITH CHECK (EXISTS (SELECT 1 FROM workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid() AND wm.role IN ('owner', 'admin')));

-- 1h. RLS policies for customers
CREATE POLICY "Members can view workspace customers" ON customers
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = customers.workspace_id AND user_id = auth.uid()));

CREATE POLICY "Members can create customers" ON customers
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = customers.workspace_id AND user_id = auth.uid()));

CREATE POLICY "Members can update customers" ON customers
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = customers.workspace_id AND user_id = auth.uid()));

CREATE POLICY "Owners/admins can delete customers" ON customers
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = customers.workspace_id AND user_id = auth.uid() AND role IN ('owner', 'admin')));

-- 1i. Admin bypass policies
CREATE POLICY "Admins have full access to workspaces" ON workspaces
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to workspace_members" ON workspace_members
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins have full access to customers" ON customers
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 1j. Update handle_new_user() function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        'customer'
    );

    -- Create default personal workspace
    INSERT INTO public.workspaces (name, created_by)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
        NEW.id
    )
    RETURNING id INTO new_workspace_id;

    -- Add user as workspace owner
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, NEW.id, 'owner');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1k. Add updated_at triggers for new tables
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1l. Create indexes for performance
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_customers_workspace_id ON customers(workspace_id);
