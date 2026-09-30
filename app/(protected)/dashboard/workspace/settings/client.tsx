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
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  member:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
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

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between px-6 py-4 sm:px-8"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {member.profiles?.full_name || "Unnamed User"}
                </p>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {member.profiles?.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyles[member.role] ?? roleBadgeStyles.member}`}
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
                      className="text-sm text-red-600 hover:text-red-500 disabled:opacity-50 dark:text-red-400"
                    >
                      Remove
                    </button>
                  )}
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
              <div className="space-y-1">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="member"
                  disabled={isInviting}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
