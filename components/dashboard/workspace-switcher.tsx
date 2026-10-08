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
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm font-medium tracking-tight text-zinc-900 shadow-2xs backdrop-blur-xs transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-100/80 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <span className="truncate">
          {current?.name ?? (workspaces.length === 0 ? "Creating workspace..." : "Select workspace")}
        </span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
          <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border border-zinc-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-zinc-800/90 dark:bg-zinc-900/95">
            <div>
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelect(ws.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm tracking-tight transition-all duration-200 ${
                    ws.id === currentWorkspaceId
                      ? "bg-gradient-to-r from-indigo-50/90 to-violet-50/70 font-semibold text-indigo-700 shadow-2xs dark:from-indigo-950/40 dark:to-violet-950/30 dark:text-indigo-300"
                      : "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="ml-2 rounded-full border border-zinc-200/70 bg-zinc-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-700/70 dark:bg-zinc-800/80 dark:text-zinc-400">
                    {ws.workspace_members?.[0]?.role || "member"}
                  </span>
                </button>
              ))}

              {workspaces.length === 0 && (
                <div className="px-3 py-2 text-xs text-zinc-400">
                  No workspaces found.
                </div>
              )}
            </div>

            {/* Create Workspace Section */}
            <div className="mt-1 border-t border-zinc-100/80 p-2 dark:border-zinc-800/80">
              {isCreating ? (
                <form onSubmit={handleCreate} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Workspace name..."
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    disabled={isPending}
                    autoFocus
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                  {error && (
                    <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      type="submit"
                      disabled={isPending || !newWorkspaceName.trim()}
                      className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
                    >
                      {isPending ? "Creating..." : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      disabled={isPending}
                      className="rounded-xl border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex w-full items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-xs font-semibold text-indigo-600 transition-all duration-200 hover:bg-indigo-50/80 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
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
