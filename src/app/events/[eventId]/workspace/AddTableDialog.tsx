"use client";

import { useState, useTransition } from "react";
import { addTableAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900">Add a table</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Design your floor plan — you can drag tables around afterward.
        </p>

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
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  shape === "round"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-zinc-200 hover:border-zinc-300",
                )}
              >
                <span className="h-10 w-10 rounded-full border-4 border-zinc-400" />
                <span className="text-sm font-medium text-zinc-700">Round</span>
              </button>
              <button
                type="button"
                onClick={() => setShape("rectangle")}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  shape === "rectangle"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-zinc-200 hover:border-zinc-300",
                )}
              >
                <span className="h-8 w-12 rounded-sm border-4 border-zinc-400" />
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
              className="w-full accent-indigo-600"
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
              Add table
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}