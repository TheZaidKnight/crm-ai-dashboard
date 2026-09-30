"use client";

import { useState } from "react";
import { DataTable } from "@/components/dashboard/data-table";

interface AdminTablesProps {
  users: Record<string, unknown>[];
  workspaces: Record<string, unknown>[];
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
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
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

type Tab = "users" | "workspaces";

export function AdminTables({ users, workspaces }: AdminTablesProps) {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  return (
    <div className="space-y-4">
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
  );
}
