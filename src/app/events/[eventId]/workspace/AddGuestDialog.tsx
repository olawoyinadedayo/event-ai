"use client";

import { useState, useTransition } from "react";
import { addGuestAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      setError(null);
      onOpenChange(false);
      onGuestAdded({
        id: crypto.randomUUID(),
        event_id: eventId,
        name: guest.name,
        email: guest.email ?? null,
        rsvp_status: guest.rsvp_status ?? "pending",
        dietary_notes: guest.dietary_notes ?? null,
        tags: guest.tags ?? [],
        table_id: null,
        seat_number: null,
      });
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">Add guest</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Add a single guest, or use AI Smart Paste for bulk entry.
        </p>

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
              className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Add guest
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}