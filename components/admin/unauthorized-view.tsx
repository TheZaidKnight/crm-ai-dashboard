"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { claimInitialAdminRole } from "@/actions/admin";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface UnauthorizedViewProps {
  userEmail: string;
  currentRole: string;
  canBootstrap: boolean;
}

export function UnauthorizedView({
  userEmail,
  currentRole,
  canBootstrap,
}: UnauthorizedViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClaimAdmin() {
    setError(null);
    startTransition(async () => {
      const res = await claimInitialAdminRole();
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(res.success || "Admin role granted! Reloading...");
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    });
  }

  const sqlCommand = `UPDATE public.profiles SET role = 'admin' WHERE email = '${userEmail}';`;
  const cliCommand = `npm run set-admin ${userEmail}`;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔒</span>
            <div>
              <CardTitle>Admin Access Required</CardTitle>
              <CardDescription>
                This area is reserved for system administrators.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-6 px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-500 dark:text-gray-400">Current User</p>
                <p className="font-mono text-gray-900 dark:text-gray-100">{userEmail}</p>
              </div>
              <div>
                <p className="font-medium text-gray-500 dark:text-gray-400">Assigned Role</p>
                <p className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {currentRole}
                </p>
              </div>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {canBootstrap && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800/40 dark:bg-purple-900/20">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                🚀 Initial Admin Setup Available
              </h4>
              <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                No active administrators were detected, or you are running in local development mode. You can bootstrap your account as the primary administrator right now.
              </p>
              <div className="mt-3">
                <Button
                  onClick={handleClaimAdmin}
                  isLoading={isPending}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Claim Admin Role Now
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Manual Provisioning Instructions
            </h4>
            
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Option 1: Run SQL in Supabase Dashboard SQL Editor
              </p>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-2.5 font-mono text-xs text-emerald-400">
                {sqlCommand}
              </pre>
            </div>

            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Option 2: Run local CLI command in project terminal
              </p>
              <pre className="mt-1 overflow-x-auto rounded bg-gray-900 p-2.5 font-mono text-xs text-blue-400">
                {cliCommand}
              </pre>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              ← Return to Customer Dashboard
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
