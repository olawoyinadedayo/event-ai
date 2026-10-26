"use client";

import { useState, useTransition } from "react";
import { addTableAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@/types/app";

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onTableAdded: (table: Table) => void;
}

export function AddTableDialog({
  open,
  onOpenChange,
  eventId,
  onTableAdded,
}: AddTableDialogProps) {
  const [shape, setShape] = useState<"round" | "rectangle">("round");
  const [capacity, setCapacity] = useState(8);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim() || `Table ${shape}`;

    startTransition(async () => {
      const result = await addTableAction(eventId, {
        name,
        shape,
        capacity,
        pos_x: 0,
        pos_y: 0,
      });
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to create table.");
        return;
      }
      setError(null);
      onOpenChange(false);
      onTableAdded(result.data);
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
              Add a table
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Design your floor plan — you can drag tables around afterward.
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
            <Label htmlFor="t-name">Table name</Label>
            <Input id="t-name" name="name" placeholder={`Table ${shape === "round" ? "3" : "5"}`} />
          </div>

          <div>
            <Label>Shape</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShape("round")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 shadow-sm shadow-zinc-950/[0.02] transition-all",
                  shape === "round"
                    ? "border-indigo-300 bg-indigo-50/70 ring-4 ring-indigo-500/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <span className="h-10 w-10 rounded-full border-4 border-zinc-300 bg-white" />
                <span className="text-sm font-medium text-zinc-700">Round</span>
              </button>
              <button
                type="button"
                onClick={() => setShape("rectangle")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 shadow-sm shadow-zinc-950/[0.02] transition-all",
                  shape === "rectangle"
                    ? "border-indigo-300 bg-indigo-50/70 ring-4 ring-indigo-500/10"
                    : "border-zinc-200 bg-white hover:border-zinc-300",
                )}
              >
                <span className="h-8 w-12 rounded-md border-4 border-zinc-300 bg-white" />
                <span className="text-sm font-medium text-zinc-700">Rectangular</span>
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="t-capacity">
              Capacity: <span className="text-indigo-600">{capacity}</span>
            </Label>
            <input
              id="t-capacity"
              type="range"
              min={2}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
              className="mt-1 w-full accent-indigo-600"
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
              Add table
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}