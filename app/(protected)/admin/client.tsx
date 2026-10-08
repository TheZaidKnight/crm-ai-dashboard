"use client";

import { useState, useTransition, useActionState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/dashboard/data-table";
import { updateUserRole, promoteUserByEmail, type AdminActionResult } from "@/actions/admin";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { UserRole } from "@/types/database";

interface AdminTablesProps {
  users: Record<string, unknown>[];
  workspaces: Record<string, unknown>[];
  auditLogs?: Record<string, unknown>[];
  currentUserId?: string;
}

const initialPromoteState: AdminActionResult = { error: null };

type Tab = "users" | "workspaces" | "audit-logs";

export function AdminTables({
  users,
  workspaces,
  auditLogs = [],
  currentUserId,
}: AdminTablesProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableSuccess, setTableSuccess] = useState<string | null>(null);
  const [selectedLogDetails, setSelectedLogDetails] = useState<Record<string, unknown> | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [, startTransition] = useTransition();

  const [promoteState, promoteAction, isPromoting] = useActionState(
    promoteUserByEmail,
    initialPromoteState
  );

  function handleToggleRole(userId: string, currentRole: string) {
    const newRole: UserRole = currentRole === "admin" ? "customer" : "admin";
    setTableError(null);
    setTableSuccess(null);
    setActionPendingId(userId);

    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      setActionPendingId(null);
      if (res.error) {
        setTableError(res.error);
      } else {
        setTableSuccess(res.success || `Role updated to ${newRole}`);
        router.refresh();
      }
    });
  }

  const userColumns = [
    { key: "email" as const, label: "Email" },
    { key: "full_name" as const, label: "Name" },
    {
      key: "role" as const,
      label: "Role",
      render: (value: unknown) => {
        const role = String(value);
        const styles =
          role === "admin"
            ? "bg-indigo-100 text-indigo-800 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/50"
            : "bg-zinc-100 text-zinc-700 border border-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/50";
        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles}`}>
            {role}
          </span>
        );
      },
    },
    {
      key: "created_at" as const,
      label: "Joined",
      render: (value: unknown) =>
        new Date(String(value)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (value: unknown, row: Record<string, unknown>) => {
        const userId = String(value);
        const role = String(row.role);
        const isSelf = userId === currentUserId;
        const isPendingThis = actionPendingId === userId;

        if (isSelf) {
          return (
            <span className="text-xs italic text-zinc-400">
              Current Admin (You)
            </span>
          );
        }

        return (
          <button
            type="button"
            disabled={isPendingThis}
            onClick={() => handleToggleRole(userId, role)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
              role === "admin"
                ? "border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800/80 dark:text-amber-400 dark:hover:bg-amber-950/30"
                : "border border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800/80 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
            }`}
          >
            {isPendingThis
              ? "Saving..."
              : role === "admin"
              ? "Demote to Customer"
              : "Promote to Admin"}
          </button>
        );
      },
    },
  ];

  const workspaceColumns = [
    { key: "name" as const, label: "Workspace Name" },
    { key: "id" as const, label: "ID", render: (v: unknown) => String(v).slice(0, 8) + "..." },
    {
      key: "created_at" as const,
      label: "Created",
      render: (value: unknown) =>
        new Date(String(value)).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
  ];

  // Helper for audit action badge styles
  function getActionBadgeStyle(action: string) {
    if (action.includes("ROLE") || action.includes("ADMIN")) {
      return "bg-indigo-100 text-indigo-800 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/50";
    }
    if (action.includes("CREATED") || action.includes("INVITED") || action.includes("SIGNED_UP")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50";
    }
    if (action.includes("REMOVED") || action.includes("DELETED") || action.includes("SIGNED_OUT")) {
      return "bg-rose-100 text-rose-800 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50";
    }
    return "bg-sky-100 text-sky-800 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/50";
  }

interface ProcessedAuditLog extends Record<string, unknown> {
  id: string;
  created_at: string;
  action: string;
  actor: string;
  workspaceName: string;
  details: Record<string, unknown>;
  profiles?: { email?: string; full_name?: string } | null;
  workspaces?: { name?: string } | null;
}

  // Pre-process audit log rows to flatten actor and workspace name for easy searching
  const processedAuditLogs: ProcessedAuditLog[] = useMemo(() => {
    return auditLogs.map((log) => {
      const profiles = log.profiles as { email?: string; full_name?: string } | null;
      const workspaces = log.workspaces as { name?: string } | null;
      const actor = profiles?.email || profiles?.full_name || (log.user_id ? String(log.user_id).slice(0, 8) : "System");
      const workspaceName = workspaces?.name || (log.workspace_id ? "Workspace" : "Global System");

      return {
        ...log,
        id: String(log.id || ""),
        created_at: String(log.created_at || ""),
        action: String(log.action || ""),
        actor,
        workspaceName,
        details: (log.details as Record<string, unknown>) || {},
        profiles,
        workspaces,
      };
    });
  }, [auditLogs]);

  // Filter audit logs by category
  const filteredAuditLogs: ProcessedAuditLog[] = useMemo(() => {
    if (actionFilter === "ALL") return processedAuditLogs;
    return processedAuditLogs.filter((log) => {
      const action = String(log.action || "");
      if (actionFilter === "WORKSPACE") return action.includes("WORKSPACE");
      if (actionFilter === "MEMBER") return action.includes("MEMBER");
      if (actionFilter === "ROLE") return action.includes("ROLE") || action.includes("ADMIN");
      if (actionFilter === "AUTH") return action.includes("USER_") || action.includes("SIGN");
      return true;
    });
  }, [processedAuditLogs, actionFilter]);

  const auditColumns = [
    {
      key: "created_at" as const,
      label: "Timestamp",
      render: (value: unknown) => {
        const d = new Date(String(value));
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      key: "action" as const,
      label: "Action",
      render: (value: unknown) => {
        const action = String(value);
        return (
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-tight ${getActionBadgeStyle(action)}`}>
            {action}
          </span>
        );
      },
    },
    {
      key: "actor" as const,
      label: "Actor",
      render: (_: unknown, row: ProcessedAuditLog) => {
        const profiles = row.profiles;
        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {profiles?.email || "System / Automated"}
            </span>
            {profiles?.full_name && (
              <span className="text-zinc-500 dark:text-zinc-400">{profiles.full_name}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "workspaceName" as const,
      label: "Scope",
      render: (_: unknown, row: ProcessedAuditLog) => {
        const workspaces = row.workspaces;
        return (
          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            {workspaces?.name || (row.workspace_id ? "Workspace" : "Global System")}
          </span>
        );
      },
    },
    {
      key: "details" as const,
      label: "Metadata",
      render: (value: unknown) => {
        const details = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
        const keys = Object.keys(details);
        if (keys.length === 0) {
          return <span className="text-xs text-zinc-400">—</span>;
        }

        return (
          <button
            type="button"
            onClick={() => setSelectedLogDetails(details)}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-[11px] text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <span>{keys.length} field{keys.length > 1 ? "s" : ""}</span>
            <span className="text-[10px] text-indigo-500">🔍 view</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Promote Card */}
      <Card>
        <CardHeader>
          <CardTitle>Grant Admin Role by Email</CardTitle>
          <CardDescription>
            Directly elevate an existing user to system administrator status
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          {promoteState.error && (
            <Alert variant="error" className="mb-4">
              {promoteState.error}
            </Alert>
          )}
          {promoteState.success && (
            <Alert variant="success" className="mb-4">
              {promoteState.success}
            </Alert>
          )}
          <form action={promoteAction} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                name="email"
                type="email"
                placeholder="user@example.com"
                required
                disabled={isPromoting}
              />
            </div>
            <Button
              type="submit"
              isLoading={isPromoting}
              size="md"
              className="sm:w-auto"
            >
              Make Admin
            </Button>
          </form>
        </div>
      </Card>

      {/* Tables section */}
      <div className="space-y-4">
        {tableError && <Alert variant="error">{tableError}</Alert>}
        {tableSuccess && <Alert variant="success">{tableSuccess}</Alert>}

        {/* Tabs */}
        <div className="flex gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-100/70 p-1.5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/60">
          {(["users", "workspaces", "audit-logs"] as Tab[]).map((tab) => {
            const count =
              tab === "users"
                ? users.length
                : tab === "workspaces"
                ? workspaces.length
                : auditLogs.length;

            const label =
              tab === "users"
                ? "Users"
                : tab === "workspaces"
                ? "Workspaces"
                : "Activity Audit Logs";

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-white font-semibold text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Action filter pills for Audit Logs */}
        {activeTab === "audit-logs" && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Action Filter:</span>
            {[
              { id: "ALL", label: "All Events" },
              { id: "WORKSPACE", label: "Workspaces" },
              { id: "MEMBER", label: "Members" },
              { id: "ROLE", label: "Roles & Admin" },
              { id: "AUTH", label: "Auth Events" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActionFilter(f.id)}
                className={`rounded-full px-3 py-1 font-semibold transition-all duration-200 ${
                  actionFilter === f.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Table content */}
        {activeTab === "users" && (
          <DataTable
            columns={userColumns}
            data={users}
            searchableKeys={["email", "full_name"]}
            emptyMessage="No users found."
          />
        )}

        {activeTab === "workspaces" && (
          <DataTable
            columns={workspaceColumns}
            data={workspaces}
            searchableKeys={["name"]}
            emptyMessage="No workspaces found."
          />
        )}

        {activeTab === "audit-logs" && (
          <DataTable<ProcessedAuditLog>
            columns={auditColumns}
            data={filteredAuditLogs}
            searchableKeys={["action", "actor", "workspaceName"]}
            emptyMessage="No audit logs recorded yet."
            pageSize={15}
          />
        )}
      </div>

      {/* Audit Log Details Modal */}
      {selectedLogDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Audit Event Metadata Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLogDetails(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-emerald-400">
              {JSON.stringify(selectedLogDetails, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => setSelectedLogDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
