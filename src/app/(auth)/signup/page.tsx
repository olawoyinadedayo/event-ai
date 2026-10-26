"use client";

import { useState, useTransition } from "react";
import { resendConfirmationAction, signupAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LogIn, MailCheck } from "lucide-react";
import Link from "next/link";

const roles = [
  { value: "diy_host", label: "DIY Host", desc: "Personal events — weddings, parties" },
  { value: "pro_planner", label: "Pro Planner", desc: "Client events, corporate, multi-event" },
];

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [role, setRole] = useState("diy_host");
  const [resendStatus, setResendStatus] = useState<"idle" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSentTo(null);
    setExistingEmail(null);
    setResendStatus("idle");
    setResendError(null);
    formData.set("role", role);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result && "error" in result && typeof result.error === "string") {
        setError(result.error);
        return;
      }
      if (
        result &&
        "accountExists" in result &&
        result.accountExists &&
        typeof result.email === "string"
      ) {
        setExistingEmail(result.email);
        return;
      }
      if (result && "email" in result && typeof result.email === "string") {
        setSentTo(result.email);
      }
    });
  }

  function handleResend() {
    if (!sentTo) return;

    setResendError(null);
    setResendStatus("idle");
    startResend(async () => {
      const formData = new FormData();
      formData.set("email", sentTo);
      const result = await resendConfirmationAction(formData);
      if (result && "error" in result && typeof result.error === "string") {
        setResendError(result.error);
        return;
      }
      setResendStatus("sent");
    });
  }

  if (existingEmail) {
    return (
      <div
        className="rounded-2xl border border-zinc-200/80 bg-white/85 p-8 text-center shadow-2xl shadow-indigo-950/[0.06] backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
          Account already exists
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          This email is already registered:
        </p>
        <p className="mt-1 break-all text-sm font-medium text-zinc-800">
          {existingEmail}
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          No confirmation email was sent. Sign in with your existing password,
          or use a different email to create a new account.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={() => {
            setExistingEmail(null);
            setError(null);
          }}
          className="mt-3 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          Use a different email
        </button>
      </div>
    );
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
          We sent a confirmation link to
        </p>
        <p className="mt-1 break-all text-sm font-medium text-zinc-800">
          {sentTo}
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          Click the link to activate your account, then sign in. It may take a
          minute to arrive — check your spam folder if you don&apos;t see it.
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Still nothing?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendStatus === "sent"}
            className="font-medium text-indigo-600 transition-colors hover:text-indigo-500 hover:underline disabled:cursor-default disabled:text-zinc-400 disabled:no-underline"
          >
            {isResending
              ? "Sending…"
              : resendStatus === "sent"
                ? "Email resent"
                : "Resend confirmation"}
          </button>
        </p>
        {resendStatus === "sent" && (
          <p className="mt-2 text-xs leading-5 text-emerald-600">
            Confirmation email resent. It may take another minute to arrive.
          </p>
        )}
        {resendError && (
          <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
            {resendError}
          </p>
        )}

        <Link
          href="/login"
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
        >
          Go to sign in
        </Link>
        <button
          type="button"
          onClick={() => {
            setSentTo(null);
            setError(null);
            setResendStatus("idle");
            setResendError(null);
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Start planning in minutes</p>
      </div>

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
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
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
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left shadow-sm shadow-zinc-950/[0.02] transition-all",
                  role === r.value
                    ? "border-indigo-300 bg-indigo-50/70 ring-4 ring-indigo-500/10"
                    : "border-zinc-200 bg-white/70 hover:border-zinc-300",
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
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full shadow-lg shadow-indigo-600/20" size="lg" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
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