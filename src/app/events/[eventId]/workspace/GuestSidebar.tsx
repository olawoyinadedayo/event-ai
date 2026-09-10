"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GuestCard } from "./GuestCard";
import { GuestFilters } from "./GuestFilters";
import { Badge } from "@/components/ui/badge";
import { Sparkles, UserPlus, Search, Users, Mail, Send } from "lucide-react";
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
      className={`flex w-[320px] shrink-0 flex-col border-r border-zinc-200 bg-white transition-colors ${
        isOver ? "ring-2 ring-inset ring-indigo-400" : ""
      }`}
    >
      {/* Header stats */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Guests</h2>
          <Badge variant="neutral">
            <Users className="h-3 w-3" /> {stats.total}
          </Badge>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-zinc-50 px-2 py-1.5">
            <div className="text-sm font-semibold text-zinc-900">{stats.confirmed}</div>
            <div className="text-[10px] text-zinc-500">Confirmed</div>
          </div>
          <div className="rounded-md bg-zinc-50 px-2 py-1.5">
            <div className="text-sm font-semibold text-emerald-600">{stats.seated}</div>
            <div className="text-[10px] text-zinc-500">Seated</div>
          </div>
          <div className="rounded-md bg-zinc-50 px-2 py-1.5">
            <div className="text-sm font-semibold text-amber-600">{stats.pending}</div>
            <div className="text-[10px] text-zinc-500">Pending</div>
          </div>
        </div>
      </div>

      {/* AI actions */}
      <div className="flex gap-2 border-b border-zinc-200 px-4 py-3">
        <button
          onClick={onSmartPaste}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-medium text-white hover:from-violet-700 hover:to-indigo-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Smart Paste
        </button>
        <button
          onClick={onAddGuest}
          className="flex items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Invites button */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <button
          onClick={onOpenInvites}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Mail className="h-4 w-4" />
          <Send className="h-4 w-4" />
          Send Invitations
        </button>
      </div>

      {/* Filters */}
      <GuestFilters
        search={search}
        onSearchChange={onSearchChange}
        tagFilter={tagFilter}
        onTagFilterChange={onTagFilterChange}
        allTags={allTags}
        rsvpFilter={rsvpFilter}
        onRsvpFilterChange={onRsvpFilterChange}
      />

      {/* Guest list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-2 h-6 w-6 text-zinc-300" />
            <p className="text-sm text-zinc-500">
              {allGuestsCount === 0
                ? "No guests yet. Add some or use AI Smart Paste."
                : "No unassigned guests match your filters."}
            </p>
          </div>
        ) : (
          <div ref={setNodeRef} className="flex min-h-full flex-col gap-2">
            <SortableContext items={guestIds} strategy={verticalListSortingStrategy}>
              {guests.map((guest) => (
                <GuestCard key={guest.id} guest={guest} />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    </aside>
  );
}