"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GuestCard } from "./GuestCard";
import { GuestFilters } from "./GuestFilters";
import { Badge } from "@/components/ui/badge";
import { Sparkles, UserPlus, Search, Users, Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest } from "@/types/app";

interface GuestSidebarProps {
  guests: Guest[];
  allGuestsCount: number;
  stats: {
    total: number;
    confirmed: number;
    seated: number;
    pending: number;
  };
  search: string;
  onSearchChange: (v: string) => void;
  tagFilter: string[];
  onTagFilterChange: (v: string[]) => void;
  allTags: string[];
  rsvpFilter: string;
  onRsvpFilterChange: (v: string) => void;
  onSmartPaste: () => void;
  onAddGuest: () => void;
  onOpenInvites: () => void;
}

export function GuestSidebar({
  guests,
  allGuestsCount,
  stats,
  search,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  allTags,
  rsvpFilter,
  onRsvpFilterChange,
  onSmartPaste,
  onAddGuest,
  onOpenInvites,
}: GuestSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "guest-pool" });

  const guestIds = useMemo(() => guests.map((g) => g.id), [guests]);

  return (
    <aside
      className={cn(
        "flex w-[332px] shrink-0 flex-col border-r border-zinc-200/70 bg-white/60 backdrop-blur-xl transition-all duration-200",
        isOver && "bg-indigo-50/70 ring-2 ring-inset ring-indigo-400",
      )}
    >
      {/* Header stats */}
      <div className="border-b border-zinc-200/70 px-4 pb-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-zinc-950">
                Guest pool
              </h2>
              <Badge variant="neutral">
                <Users className="h-3 w-3" /> {stats.total}
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              Drag a guest onto a seat
            </p>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
            <Users className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
          {[
            {
              label: "Confirmed",
              value: stats.confirmed,
              tone: "text-emerald-600",
              dot: "bg-emerald-500",
            },
            {
              label: "Seated",
              value: stats.seated,
              tone: "text-indigo-600",
              dot: "bg-indigo-500",
            },
            {
              label: "Pending",
              value: stats.pending,
              tone: "text-amber-600",
              dot: "bg-amber-400",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-100 bg-white/70 px-2 py-2"
            >
              <div className={cn("text-sm font-semibold tabular-nums", item.tone)}>
                {item.value}
              </div>
              <div className="mt-0.5 flex items-center justify-center gap-1 text-[9px] text-zinc-400">
                <span className={cn("h-1 w-1 rounded-full", item.dot)} />
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI actions */}
      <div className="flex gap-2 border-b border-zinc-200/70 px-4 py-3">
        <button
          onClick={onSmartPaste}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Smart Paste
        </button>
        <button
          onClick={onAddGuest}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2.5 text-xs font-medium text-zinc-700 shadow-sm shadow-zinc-950/5 transition-colors hover:border-zinc-300 hover:bg-white"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Invites button */}
      <div className="border-b border-zinc-200/70 px-4 py-3">
        <button
          onClick={onOpenInvites}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 px-4 py-2.5 text-xs font-medium text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/70"
        >
          <Mail className="h-3.5 w-3.5" />
          Send invitations
          <Send className="h-3 w-3 opacity-60" />
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-zinc-200/70 px-4 py-3">
        <GuestFilters
          search={search}
          onSearchChange={onSearchChange}
          tagFilter={tagFilter}
          onTagFilterChange={onTagFilterChange}
          allTags={allTags}
          rsvpFilter={rsvpFilter}
          onRsvpFilterChange={onRsvpFilterChange}
        />
      </div>

      {/* Guest list */}
      <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white/60 text-zinc-300">
              <Search className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {allGuestsCount === 0
                ? "No guests yet. Add some or use AI Smart Paste."
                : "No unassigned guests match your filters."}
            </p>
          </div>
        ) : (
          <div
            ref={setNodeRef}
            className="flex min-h-full flex-col gap-2 rounded-xl"
          >
            <SortableContext items={guestIds} strategy={verticalListSortingStrategy}>
              {guests.map((guest) => (
                <GuestCard key={guest.id} guest={guest} />
              ))}
            </SortableContext>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200/70 px-4 py-2.5 text-center text-[10px] text-zinc-400">
        {guests.length} unassigned · drop here to remove from a table
      </div>
    </aside>
  );
}
