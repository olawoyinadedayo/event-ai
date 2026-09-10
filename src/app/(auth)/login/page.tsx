"use client";

import { useState, useTransition } from "react";
import { loginAction } from "../actions";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your EventPilot account</p>
      </div>

      <OAuthButtons />

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}