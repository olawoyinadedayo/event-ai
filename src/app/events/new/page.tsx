"use client";

import { useState, useTransition } from "react";
import { createEventAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  Sparkles,
  Users,
} from "lucide-react";

const eventTypes = [
  "wedding",
  "corporate",
  "birthday",
  "anniversary",
  "baby_shower",
  "fundraiser",
  "other",
];

export default function NewEventPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createEventAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="app-mesh min-h-screen text-zinc-900">
      <header className="border-b border-zinc-200/70 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/80 bg-white/70 text-zinc-400 shadow-sm shadow-zinc-950/5 transition-colors hover:text-zinc-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-600/20">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              New event
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-16">
        <div className="animate-soft-rise lg:pt-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-indigo-600 shadow-sm shadow-indigo-950/5">
            <Sparkles className="h-3 w-3" />
            Start planning
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
            Let&apos;s set the stage.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
            Create an event workspace and bring your guest list, seating chart,
            budget, and AI planning together.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                icon: Users,
                title: "One living guest list",
                description:
                  "Import, filter, and track RSVPs without spreadsheet chaos.",
              },
              {
                icon: Sparkles,
                title: "AI-assisted seating",
                description:
                  "Drag guests onto seats or ask the Co-Pilot to arrange the room.",
              },
              {
                icon: DollarSign,
                title: "Budget clarity",
                description:
                  "See estimates, actual spend, and pending payments at a glance.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-zinc-200/80 bg-white/80 text-indigo-600 shadow-sm shadow-zinc-950/[0.03]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form
          action={handleSubmit}
          className="bento-card animate-soft-rise space-y-5 rounded-2xl p-6 shadow-xl shadow-indigo-950/[0.04] [animation-delay:100ms] sm:p-7"
        >
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              Event details
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              You can adjust everything later in the workspace.
            </p>
          </div>

          <div>
            <Label htmlFor="name">Event name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Sarah & Alex's Wedding"
            />
          </div>

          <div>
            <Label htmlFor="event_type">Event type</Label>
            <select
              id="event_type"
              name="event_type"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white/80 px-3.5 text-sm capitalize text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all hover:border-zinc-300 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              {eventTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="date">Event date</Label>
            <Input id="date" name="date" type="datetime-local" />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-5">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create event"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
