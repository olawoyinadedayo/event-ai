"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { requestPasswordResetAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordForm({
  initialError,
}: {
  initialError?: string | null;
}) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);
      if (result && "error" in result && typeof result.error === "string") {
        setError(result.error);
        return;
      }
      if (result && "email" in result && typeof result.email === "string") {
        setSentTo(result.email);
      }
    });
  }

  if (sentTo) {
    return (
      <div
        className="rounded-2xl border border-zinc-200/80 bg-white/85 p-8 text-center shadow-2xl shadow-indigo-950/[0.06] backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
          Check your email
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          If an account exists for
        </p>
        <p className="mt-1 break-all text-sm font-medium text-zinc-800">{sentTo}</p>
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          a password reset link is on its way. It may take a minute to arrive —
          check your spam folder if you don&apos;t see it.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          Back to sign in
        </Link>
        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setError(null);
          }}
          className="mt-3 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/85 p-8 shadow-2xl shadow-indigo-950/[0.06] backdrop-blur-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full shadow-lg shadow-indigo-600/20"
          size="lg"
          disabled={isPending}
        >
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
