"use client";

import { useMemo } from "react";
import {
  Mail,
  MapPin,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { GuestFilters } from "./GuestFilters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Guest, Table } from "@/types/app";

interface GuestRosterProps {
  guests: Guest[];
  allGuestsCount: number;
  tables: Table[];
  stats: {
    total: number;
    confirmed: number;
    seated: number;
    pending: number;
    declined: number;
  };
  search: string;
  onSearchChange: (value: string) => void;
  tagFilter: string[];
  onTagFilterChange: (value: string[]) => void;
  allTags: string[];
  rsvpFilter: string;
  onRsvpFilterChange: (value: string) => void;
  onSmartPaste: () => void;
  onAddGuest: () => void;
  onOpenInvites: () => void;
}

const rsvpVariant: Record<
  Guest["rsvp_status"],
  "success" | "warning" | "danger"
> = {
  confirmed: "success",
  pending: "warning",
  declined: "danger",
};

const avatarStyles = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function GuestRoster({
  guests,
  allGuestsCount,
  tables,
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
}: GuestRosterProps) {
  const tableLookup = useMemo(() => {
    const lookup = new Map<string, Table>();
    tables.forEach((table) => lookup.set(table.id, table));
    return lookup;
  }, [tables]);

  const filteredCount = guests.length;

  return (
    <div className="h-full w-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-6xl px-5 pb-32 pt-7 sm:px-7 lg:px-10 lg:pt-9">
        <div className="animate-soft-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-indigo-600 shadow-sm shadow-indigo-950/5">
              <Users className="h-3 w-3" />
              Guest management
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
              Guest list
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500">
              Everyone invited to the event, their RSVP, and where they are
              sitting.
            </p>
          </div>

          <div className="flex flex-wrap shrink-0 items-center gap-2">
            <button
              onClick={onOpenInvites}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3.5 text-sm font-medium text-zinc-700 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white"
            >
              <Send className="h-4 w-4" />
              Invites
            </button>
            <button
              onClick={onAddGuest}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              <UserPlus className="h-4 w-4" />
              Add guest
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "All guests", value: stats.total, tone: "text-zinc-950" },
            {
              label: "Confirmed",
              value: stats.confirmed,
              tone: "text-emerald-600",
            },
            { label: "Seated", value: stats.seated, tone: "text-indigo-600" },
            {
              label: "Unassigned",
              value: stats.total - stats.seated,
              tone: "text-amber-600",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className="animate-soft-rise rounded-2xl border border-zinc-200/80 bg-white/75 px-4 py-3 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-sm"
              style={{ animationDelay: `${60 + index * 35}ms` }}
            >
              <div className={cn("text-xl font-semibold tracking-tight", item.tone)}>
                {item.value}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-400">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="animate-soft-rise h-fit rounded-2xl border border-zinc-200/80 bg-white/80 p-4 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-sm [animation-delay:120ms]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Filters
              </h2>
              {filteredCount !== allGuestsCount && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                  {filteredCount} shown
                </span>
              )}
            </div>
            <GuestFilters
              search={search}
              onSearchChange={onSearchChange}
              tagFilter={tagFilter}
              onTagFilterChange={onTagFilterChange}
              allTags={allTags}
              rsvpFilter={rsvpFilter}
              onRsvpFilterChange={onRsvpFilterChange}
            />

            <div className="mt-5 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/60 p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                AI Smart Paste
              </div>
              <p className="mt-1 text-[11px] leading-5 text-indigo-900/55">
                Paste an email thread or upload a CSV and let AI build the list
                for you.
              </p>
              <button
                onClick={onSmartPaste}
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 transition-colors hover:text-indigo-500"
              >
                Import guests
                <span aria-hidden>→</span>
              </button>
            </div>
          </aside>

          <section className="animate-soft-rise overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/85 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-sm [animation-delay:160ms]">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,0.65fr)] gap-4 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 md:grid">
              <span>Guest</span>
              <span>Seating</span>
              <span>Invite status</span>
            </div>

            {guests.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400">
                  <Users className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                  {allGuestsCount === 0 ? "No guests yet" : "No matching guests"}
                </h3>
                <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
                  {allGuestsCount === 0
                    ? "Add a guest manually or import a list with AI Smart Paste."
                    : "Try clearing a filter or searching for a different name."}
                </p>
                <button
                  onClick={onAddGuest}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add guest
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {guests.map((guest, index) => {
                  const table = guest.table_id
                    ? tableLookup.get(guest.table_id)
                    : null;

                  return (
                    <div
                      key={guest.id}
                      className="group grid gap-3 px-5 py-4 transition-colors hover:bg-indigo-50/25 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)_minmax(0,0.65fr)] md:items-center md:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-semibold ring-2 ring-white",
                            avatarStyles[index % avatarStyles.length],
                          )}
                        >
                          {initials(guest.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-zinc-900">
                              {guest.name}
                            </span>
                            <Badge variant={rsvpVariant[guest.rsvp_status]}>
                              {guest.rsvp_status}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="truncate text-xs text-zinc-400">
                              {guest.email ?? "No email added"}
                            </span>
                            {guest.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0 pl-12 md:pl-0">
                        {table ? (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                            <span className="truncate">{table.name}</span>
                            {guest.seat_number !== null && (
                              <span className="shrink-0 text-zinc-400">
                                · Seat {guest.seat_number + 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/10">
                            Unassigned
                          </span>
                        )}
                      </div>

                      <div className="pl-12 md:pl-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                            guest.invite_sent
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                              : "bg-zinc-50 text-zinc-500 ring-zinc-500/10",
                          )}
                        >
                          <Mail className="h-3 w-3" />
                          {guest.invite_sent ? "Invited" : "Not invited"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {guests.length > 0 && (
              <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-5 py-3 text-[11px] text-zinc-400">
                <span>
                  Showing {filteredCount} of {allGuestsCount} guests
                </span>
                <span>{stats.pending} awaiting RSVP</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
