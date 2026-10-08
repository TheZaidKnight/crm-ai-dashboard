"use client";

import { useActionState, useState, useTransition } from "react";
import { inviteMember, removeMember, type WorkspaceResult } from "@/actions/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { WorkspaceMemberWithProfile } from "@/types/database";

interface Props {
  workspaceId: string;
  members: WorkspaceMemberWithProfile[];
  isOwnerOrAdmin: boolean;
  currentUserId: string;
}

const initialState: WorkspaceResult = { error: null };

const roleBadgeStyles: Record<string, string> = {
  owner:
    "bg-indigo-100 text-indigo-800 border border-indigo-200/60 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/50",
  admin:
    "bg-violet-100 text-violet-800 border border-violet-200/60 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-900/50",
  member:
    "bg-zinc-100 text-zinc-700 border border-zinc-200/60 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/50",
};

export function WorkspaceSettingsClient({
  workspaceId,
  members,
  isOwnerOrAdmin,
  currentUserId,
}: Props) {
  const [inviteState, inviteAction, isInviting] = useActionState(
    inviteMember,
    initialState
  );
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(userId: string) {
    startTransition(async () => {
      const result = await removeMember(workspaceId, userId);
      if (result.error) setRemoveError(result.error);
      else setRemoveError(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            People with access to this workspace
          </CardDescription>
        </CardHeader>

        {removeError && (
          <Alert variant="error" className="mx-6 mb-4">
            {removeError}
          </Alert>
        )}

        <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-6 py-4.5 sm:px-8 transition-colors duration-150 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {member.profiles?.full_name || "Unnamed User"}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {member.profiles?.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${roleBadgeStyles[member.role] ?? roleBadgeStyles.member}`}
                >
                  {member.role}
                </span>
                {isOwnerOrAdmin &&
                  member.user_id !== currentUserId &&
                  member.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.user_id)}
                      disabled={isPending}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50 dark:text-rose-400 hover:underline transition-all"
                    >
                      Remove
                    </button>
                  )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No members found.
            </div>
          )}
        </div>
      </Card>

      {/* Invite form */}
      {isOwnerOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>
              Add a new member by their email address
            </CardDescription>
          </CardHeader>

          {inviteState.error && (
            <Alert variant="error" className="mx-6 mb-4">
              {inviteState.error}
            </Alert>
          )}
          {inviteState.success && (
            <Alert variant="success" className="mx-6 mb-4">
              {inviteState.success}
            </Alert>
          )}

          <form action={inviteAction} className="space-y-4 px-6 pb-6 sm:px-8 sm:pb-8">
            <input type="hidden" name="workspace_id" value={workspaceId} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email address"
                name="email"
                type="email"
                placeholder="colleague@company.com"
                required
                disabled={isInviting}
              />
              <div className="space-y-1.5">
                <label
                  htmlFor="role"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="member"
                  disabled={isInviting}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 shadow-xs transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-indigo-500/15 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:bg-zinc-900"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <Button type="submit" isLoading={isInviting}>
              Send Invite
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
