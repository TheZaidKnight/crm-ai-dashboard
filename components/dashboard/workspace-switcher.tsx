"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { WorkspaceWithRole } from "@/types/database";

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceWithRole[];
  currentWorkspaceId: string;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const current = workspaces.find((w) => w.id === currentWorkspaceId);

  function handleSelect(workspaceId: string) {
    setIsOpen(false);
    // Store selected workspace in cookie for server-side access
    document.cookie = `workspace_id=${workspaceId};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        <span className="truncate">{current?.name ?? "Select workspace"}</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleSelect(ws.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  ws.id === currentWorkspaceId
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="truncate">{ws.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {ws.workspace_members?.[0]?.role}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
