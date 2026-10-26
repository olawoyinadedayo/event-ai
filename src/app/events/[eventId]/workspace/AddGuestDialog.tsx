"use client";

import { useState, useTransition } from "react";
import { addGuestAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import type { Guest, NewGuest } from "@/types/app";

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onGuestAdded: (guest: Guest) => void;
}

const rsvpOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
];

export function AddGuestDialog({
  open,
  onOpenChange,
  eventId,
  onGuestAdded,
}: AddGuestDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const guest: NewGuest = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || null,
      rsvp_status: String(formData.get("rsvp_status") ?? "pending") as NewGuest["rsvp_status"],
      dietary_notes: String(formData.get("dietary_notes") ?? "").trim() || null,
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (!guest.name) {
      setError("Name is required.");
      return;
    }

    startTransition(async () => {
      const result = await addGuestAction(eventId, guest);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.data) {
        setError("Guest was not created.");
        return;
      }
      setError(null);
      onOpenChange(false);
      onGuestAdded(result.data);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className="animate-soft-rise w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/25">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">
              Add guest
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Add a single guest, or use AI Smart Paste for bulk entry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="g-name">Name *</Label>
            <Input id="g-name" name="name" required placeholder="Guest name" />
          </div>

          <div>
            <Label htmlFor="g-email">Email</Label>
            <Input id="g-email" name="email" type="email" placeholder="guest@example.com" />
          </div>

          <div>
            <Label htmlFor="g-rsvp">RSVP status</Label>
            <select
              id="g-rsvp"
              name="rsvp_status"
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            >
              {rsvpOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="g-tags">Tags (comma-separated)</Label>
            <Input id="g-tags" name="tags" placeholder="Family, Groom Side, Vegan" />
          </div>

          <div>
            <Label htmlFor="g-dietary">Dietary notes</Label>
            <Textarea
              id="g-dietary"
              name="dietary_notes"
              placeholder="Gluten-Free, Nut Allergy…"
              rows={2}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              Add guest
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}