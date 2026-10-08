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
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Current User</p>
                <p className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{userEmail}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Assigned Role</p>
                <p className="mt-0.5 inline-block rounded-full border border-amber-200/70 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold uppercase text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  {currentRole}
                </p>
              </div>
            </div>
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {canBootstrap && (
            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/40">
              <h4 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                🚀 Initial Admin Setup Available
              </h4>
              <p className="mt-1 text-xs text-indigo-800/90 dark:text-indigo-300">
                No active administrators were detected, or you are running in local development mode. You can bootstrap your account as the primary administrator right now.
              </p>
              <div className="mt-4">
                <Button
                  onClick={handleClaimAdmin}
                  isLoading={isPending}
                  size="sm"
                >
                  Claim Admin Role Now
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Manual Provisioning Instructions
            </h4>
            
            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Option 1: Run SQL in Supabase Dashboard SQL Editor
              </p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-zinc-950 p-3 font-mono text-xs text-emerald-400">
                {sqlCommand}
              </pre>
            </div>

            <div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Option 2: Run local CLI command in project terminal
              </p>
              <pre className="mt-1 overflow-x-auto rounded-xl bg-zinc-950 p-3 font-mono text-xs text-indigo-400">
                {cliCommand}
              </pre>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              ← Return to Customer Dashboard
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
