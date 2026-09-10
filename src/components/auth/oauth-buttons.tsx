"use client";

import { useState, useTransition } from "react";
import { oauthSignInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const oauthProviders = [
  {
    id: "google" as const,
    label: "Google",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z"
        />
      </svg>
    ),
  },
  {
    id: "github" as const,
    label: "GitHub",
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
      </svg>
    ),
  },
];

export function OAuthButtons() {
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleOAuth(provider: "google" | "github") {
    setOauthError(null);
    setOauthPending(provider);
    startTransition(async () => {
      const result = await oauthSignInAction(provider);
      setOauthPending(null);
      if (result.error) {
        setOauthError(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {oauthProviders.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full"
            loading={oauthPending === provider.id}
            onClick={() => handleOAuth(provider.id)}
          >
            {oauthPending === provider.id ? null : provider.icon}
            {provider.label}
          </Button>
        ))}
      </div>

      {oauthError && (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {oauthError}
        </p>
      )}

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs text-zinc-400">or continue with email</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>
    </>
  );
}