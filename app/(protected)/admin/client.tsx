"use client";

import { useState, useTransition, useActionState } from "react";
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
  currentUserId?: string;
}

const initialPromoteState: AdminActionResult = { error: null };

type Tab = "users" | "workspaces";

export function AdminTables({ users, workspaces, currentUserId }: AdminTablesProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableSuccess, setTableSuccess] = useState<string | null>(null);
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
          {(["users", "workspaces"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab} ({tab === "users" ? users.length : workspaces.length})
            </button>
          ))}
        </div>

        {/* Table content */}
        {activeTab === "users" ? (
          <DataTable
            columns={userColumns}
            data={users}
            searchableKeys={["email", "full_name"]}
            emptyMessage="No users found."
          />
        ) : (
          <DataTable
            columns={workspaceColumns}
            data={workspaces}
            searchableKeys={["name"]}
            emptyMessage="No workspaces found."
          />
        )}
      </div>
    </div>
  );
}
