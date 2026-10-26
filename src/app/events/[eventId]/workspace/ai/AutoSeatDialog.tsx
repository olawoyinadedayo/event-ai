"use client";

import { useMemo, useState, useTransition } from "react";
import { generateSeatingPlanAction, applySeatingPlanAction } from "../../ai/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X } from "lucide-react";
import type { Guest, Table } from "@/types/app";
import type { AutoSeatAssignment } from "../../ai/actions";

interface AutoSeatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  guests: Guest[];
  tables: Table[];
  onSeated: (plan: AutoSeatAssignment[]) => void;
}

export function AutoSeatDialog({
  open,
  onOpenChange,
  eventId,
  guests,
  tables,
  onSeated,
}: AutoSeatDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<AutoSeatAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isApplying, startApply] = useTransition();

  const unassignedConfirmed = useMemo(
    () =>
      guests.filter(
        (g) => !g.table_id && g.rsvp_status === "confirmed",
      ),
    [guests],
  );

  const totalCapacity = useMemo(
    () => tables.reduce((sum, t) => sum + t.capacity, 0),
    [tables],
  );

  if (!open) return null;

  function handleClose() {
    setPrompt("");
    setPlan(null);
    setError(null);
    onOpenChange(false);
  }

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      const result = await generateSeatingPlanAction(eventId, prompt);
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to generate seating plan.");
        setPlan(null);
        return;
      }
      setPlan(result.data);
    });
  }

  function handleApply() {
    if (!plan) return;
    setError(null);
    startApply(async () => {
      const result = await applySeatingPlanAction(plan);
      if (result.error) {
        setError(result.error);
        return;
      }
      onSeated(plan);
      handleClose();
    });
  }

  const tableName = (id: string) =>
    tables.find((t) => t.id === id)?.name ?? "Unknown table";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="animate-soft-rise flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/25">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                AI Auto-Seat
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Let AI arrange confirmed guests around your tables.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-2.5 text-sm">
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm shadow-zinc-950/[0.02]">
              <div className="font-semibold text-zinc-900">
                {unassignedConfirmed.length}
              </div>
              <div className="text-[10px] text-zinc-500">to seat</div>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm shadow-zinc-950/[0.02]">
              <div className="font-semibold text-zinc-900">{tables.length}</div>
              <div className="text-[10px] text-zinc-500">tables</div>
            </div>
            <div className="rounded-xl bg-white px-3 py-2 shadow-sm shadow-zinc-950/[0.02]">
              <div className="font-semibold text-emerald-600">{totalCapacity}</div>
              <div className="text-[10px] text-zinc-500">total capacity</div>
            </div>
          </div>

          {!plan ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-zinc-500">
                Give the AI any special instructions, then generate a plan.
                It seats confirmed, unassigned guests respecting capacities,
                tags, and dietary groupings.
              </p>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  'Optional instructions… e.g.\n"Keep the bride\'s college friends together, seat all vegans at Table 2, and keep conservative relatives away from the rowdy group."'
                }
                rows={4}
              />
              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Proposed plan — {plan.length} guest{plan.length === 1 ? "" : "s"}
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPlan(null)}>
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50/80 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Guest</th>
                      <th className="px-3 py-2.5 font-medium">Table</th>
                      <th className="px-3 py-2.5 font-medium">Seat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {plan.map((a) => {
                      const guest = guests.find((g) => g.id === a.guestId);
                      return (
                        <tr key={a.guestId}>
                          <td className="px-3 py-2 font-medium text-zinc-900">
                            {guest?.name ?? "Unknown"}
                            {guest?.dietary_notes && (
                              <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 ring-1 ring-inset ring-amber-600/10">
                                {guest.dietary_notes}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-zinc-600">
                            {tableName(a.tableId)}
                          </td>
                          <td className="px-3 py-2 text-zinc-600">
                            {a.seatNumber + 1}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-600/10">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {!plan ? (
            <Button
              onClick={handleGenerate}
              disabled={
                isGenerating || unassignedConfirmed.length === 0 || tables.length === 0
              }
            >
              <Sparkles className="h-4 w-4" />
              Generate plan
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={isApplying}>
              Apply seating
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}