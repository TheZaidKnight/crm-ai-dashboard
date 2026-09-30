// ============================================================
// Enums
// ============================================================
export type UserRole = 'customer' | 'admin';
export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type CustomerStatus = 'active' | 'inactive' | 'lead';

// ============================================================
// Table Row Types
// ============================================================
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface Customer {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  company: string | null;
  status: CustomerStatus;
  revenue: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Joined / View Types (for UI convenience)
// ============================================================
export interface WorkspaceMemberWithProfile extends WorkspaceMember {
  profiles: Pick<Profile, 'email' | 'full_name'>;
}

export interface WorkspaceWithRole extends Workspace {
  workspace_members: Pick<WorkspaceMember, 'role'>[];
}

// ============================================================
// AI / Analytics Types
// ============================================================
export interface ForecastRequest {
  data: number[];
  periods: number;
}

export interface ForecastResponse {
  historical: number[];
  forecast: number[];
  periods: number;
  model_summary: string;
}

// ============================================================
// Admin Stats
// ============================================================
export interface SystemStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalCustomers: number;
  recentUsers: Pick<Profile, 'id' | 'email' | 'full_name' | 'role' | 'created_at'>[];
}

// ============================================================
// Supabase Database Type Map
// ============================================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      workspaces: {
        Row: Workspace;
        Insert: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Workspace, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'workspaces_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: Omit<WorkspaceMember, 'id' | 'joined_at'>;
        Update: Partial<Pick<WorkspaceMember, 'role'>>;
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Customer, 'id' | 'workspace_id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'customers_workspace_id_fkey';
            columns: ['workspace_id'];
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      workspace_role: WorkspaceRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
