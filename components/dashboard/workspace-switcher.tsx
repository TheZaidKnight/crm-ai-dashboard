"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createWorkspace, switchWorkspace } from "@/actions/workspace";
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
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const current = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];

  function handleSelect(workspaceId: string) {
    setIsOpen(false);
    setIsCreating(false);
    setError(null);
    startTransition(async () => {
      await switchWorkspace(workspaceId);
      router.refresh();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setError(null);
    const formData = new FormData();
    formData.append("name", newWorkspaceName.trim());

    startTransition(async () => {
      const result = await createWorkspace({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setNewWorkspaceName("");
        setIsCreating(false);
        setIsOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsCreating(false);
          setError(null);
        }}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
      >
        <span className="truncate">
          {current?.name ?? (workspaces.length === 0 ? "Creating workspace..." : "Select workspace")}
        </span>
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
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
            }}
          />
          <div className="absolute left-0 right-0 z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelect(ws.id)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    ws.id === currentWorkspaceId
                      ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {ws.workspace_members?.[0]?.role || "member"}
                  </span>
                </button>
              ))}

              {workspaces.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400">
                  No workspaces found.
                </div>
              )}
            </div>

            {/* Create Workspace Section */}
            <div className="border-t border-gray-100 p-2 dark:border-gray-700">
              {isCreating ? (
                <form onSubmit={handleCreate} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Workspace name..."
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    disabled={isPending}
                    autoFocus
                    className="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                  {error && (
                    <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      disabled={isPending || !newWorkspaceName.trim()}
                      className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isPending ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      disabled={isPending}
                      className="rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <span className="text-base font-bold leading-none">+</span>
                  <span>Create Workspace</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
