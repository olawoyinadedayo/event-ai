"use client";

import { useState, useTransition } from "react";
import { loginAction, resendConfirmationAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent">("idle");
  const [resendError, setResendError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setNeedsConfirmation(false);
    setConfirmationEmail(null);
    setResendStatus("idle");
    setResendError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
        if (result.needsConfirmation && result.email) {
          setNeedsConfirmation(true);
          setConfirmationEmail(result.email);
        }
      }
    });
  }

  function handleResend() {
    if (!confirmationEmail) return;

    setResendError(null);
    startResend(async () => {
      const formData = new FormData();
      formData.set("email", confirmationEmail);
      const result = await resendConfirmationAction(formData);
      if (result && "error" in result && typeof result.error === "string") {
        setResendError(result.error);
        return;
      }
      setResendStatus("sent");
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white/85 p-8 shadow-2xl shadow-indigo-950/[0.06] backdrop-blur-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your EventPilot account</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
            {error}
          </p>
        )}

        {needsConfirmation && confirmationEmail && (
          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/10">
            <p className="flex items-center gap-1.5 font-medium">
              <MailCheck className="size-3.5" />
              Didn&apos;t receive the email?
            </p>
            <p className="mt-1 text-amber-700">
              We can send a fresh confirmation link to {confirmationEmail}.
            </p>
            {resendStatus === "sent" ? (
              <p className="mt-2 font-medium text-emerald-700">Confirmation email sent.</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="mt-2 font-medium text-indigo-600 hover:underline disabled:opacity-60"
              >
                {isResending ? "Sending…" : "Resend confirmation email"}
              </button>
            )}
            {resendError && <p className="mt-2 text-red-600">{resendError}</p>}
          </div>
        )}

        <Button type="submit" className="w-full shadow-lg shadow-indigo-600/20" size="lg" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
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