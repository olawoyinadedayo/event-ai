"use client";

import { useState, useTransition } from "react";
import { signupAction } from "../actions";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

const roles = [
  { value: "diy_host", label: "DIY Host", desc: "Personal events — weddings, parties" },
  { value: "pro_planner", label: "Pro Planner", desc: "Client events, corporate, multi-event" },
];

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState("diy_host");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("role", role);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">Start planning in minutes</p>
      </div>

      <OAuthButtons />
      <p className="mb-5 text-center text-xs text-zinc-400">
        OAuth accounts start as a DIY Host — you can upgrade to Pro Planner later.
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required placeholder="Your name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
        </div>

        <div>
          <Label>I&apos;m a…</Label>
          <div className="space-y-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  role === r.value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-zinc-200 hover:border-zinc-300",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
                    role === r.value ? "border-indigo-600" : "border-zinc-300",
                  )}
                >
                  {role === r.value && (
                    <span className="flex h-full w-full items-center justify-center rounded-full">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    </span>
                  )}
                </span>
                <span>
                  <span className="block text-sm font-medium text-zinc-900">{r.label}</span>
                  <span className="block text-xs text-zinc-500">{r.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          Create account
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}