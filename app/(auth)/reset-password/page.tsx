"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPassword, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const initialState: AuthResult = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>

      {state.error && (
        <Alert variant="error" className="mb-4">
          {state.error}
        </Alert>
      )}

      {state.success && (
        <Alert variant="success" className="mb-4">
          {state.success}
        </Alert>
      )}

      <form action={formAction} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={isPending}
        />

        <Button type="submit" isLoading={isPending} className="w-full">
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
}
