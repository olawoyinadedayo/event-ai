"use client";

import { useState, useTransition } from "react";
import { createEventAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-4 px-4">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-zinc-900">Create a new event</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <form action={handleSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6">
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
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={isPending}>
              Create event
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}