"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";
import { loadDemoEventAction } from "./actions";

interface LoadDemoEventButtonProps {
  className?: string;
}

export function LoadDemoEventButton({ className }: LoadDemoEventButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await loadDemoEventAction();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Button
        type="button"
        size="lg"
        onClick={handleClick}
        disabled={isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-indigo-600/20"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isPending ? "Building demo event…" : "Load demo event"}
      </Button>
      {error && (
        <p
          role="alert"
          className="max-w-xs rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10"
        >
          {error}
        </p>
      )}
    </div>
  );
}
