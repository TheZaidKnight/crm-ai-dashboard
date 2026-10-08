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
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
        return (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${styles}`}>
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
            <span className="text-xs italic text-gray-400">
              Current Admin (You)
            </span>
          );
        }

        return (
          <button
            type="button"
            disabled={isPendingThis}
            onClick={() => handleToggleRole(userId, role)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              role === "admin"
                ? "border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                : "border border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20"
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
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200";
    }
    if (action.includes("CREATED") || action.includes("INVITED") || action.includes("SIGNED_UP")) {
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200";
    }
    if (action.includes("REMOVED") || action.includes("DELETED") || action.includes("SIGNED_OUT")) {
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200";
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200";
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
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
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
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {profiles?.email || "System / Automated"}
            </span>
            {profiles?.full_name && (
              <span className="text-gray-500 dark:text-gray-400">{profiles.full_name}</span>
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
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
          return <span className="text-xs text-gray-400">—</span>;
        }

        return (
          <button
            type="button"
            onClick={() => setSelectedLogDetails(details)}
            className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <span>{keys.length} field{keys.length > 1 ? "s" : ""}</span>
            <span className="text-[10px] text-blue-500">🔍 view</span>
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
              className="bg-purple-600 hover:bg-purple-700 sm:w-auto"
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
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900">
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
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
            <span className="font-medium text-gray-500 dark:text-gray-400">Action Filter:</span>
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
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  actionFilter === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Audit Event Metadata Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLogDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg bg-gray-950 p-4 font-mono text-xs text-emerald-400">
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
