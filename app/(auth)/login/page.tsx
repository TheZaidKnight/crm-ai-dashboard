"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const initialState: AuthResult = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>

      {state.error && (
        <Alert variant="error" className="mb-4">
          {state.error}
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

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isPending}
        />

        <Button type="submit" isLoading={isPending} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          <Link
            href="/reset-password"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Forgot your password?
          </Link>
        </p>
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  );
}
