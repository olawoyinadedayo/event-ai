"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  closestCorners,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { Event, Guest, Table } from "@/types/app";
import type { CurrencyCode } from "@/types/database";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { GuestSidebar } from "./GuestSidebar";
import { GuestRoster } from "./GuestRoster";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
import { WorkspaceOverview } from "./WorkspaceOverview";
import { WorkspaceDock, type WorkspaceView } from "./WorkspaceDock";
import { CoPilotChat } from "./ai/CoPilotChat";
import { BudgetTab } from "./BudgetTab";
import { InvitesDialog } from "./InvitesDialog";
import { GuestCard } from "./GuestCard";
import { SmartPasteDialog } from "./ai/SmartPasteDialog";
import { AutoSeatDialog } from "./ai/AutoSeatDialog";
import { AddTableDialog } from "./AddTableDialog";
import { AddGuestDialog } from "./AddGuestDialog";
import { createClient } from "@/lib/supabase/client";
import {
  assignGuestToSeatAction,
  unassignGuestAction,
  updateEventCurrencyAction,
  updateTablePositionAction,
} from "../actions";
import {
  CalendarDays,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

interface EventWorkspaceProps {
  initialEvent: Event;
  initialGuests: Guest[];
  initialTables: Table[];
}

type ActiveTab = WorkspaceView;

export function EventWorkspace({
  initialEvent,
  initialGuests,
  initialTables,
}: EventWorkspaceProps) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [smartPasteOpen, setSmartPasteOpen] = useState(false);
  const [autoSeatOpen, setAutoSeatOpen] = useState(false);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [currency, setCurrency] = useState<CurrencyCode>(
    initialEvent.currency ?? DEFAULT_CURRENCY,
  );

  const supabase = useMemo(() => createClient(), []);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`event-${initialEvent.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guests",
          filter: `event_id=eq.${initialEvent.id}`,
        },
        (payload) => {
          setGuests((prev) => {
            if (payload.eventType === "INSERT") {
              if (prev.some((g) => g.id === payload.new.id)) return prev;
              return [payload.new as Guest, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((g) =>
                g.id === payload.new.id ? (payload.new as Guest) : g,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((g) => g.id !== payload.old.id);
            }
            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
          filter: `event_id=eq.${initialEvent.id}`,
        },
        (payload) => {
          setTables((prev) => {
            if (payload.eventType === "INSERT") {
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              return [...prev, payload.new as Table];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Table) : t,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== payload.old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, initialEvent.id]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    guests.forEach((g) => g.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return guests
      .filter((g) => !g.table_id)
      .filter((g) => {
        if (rsvpFilter !== "all" && g.rsvp_status !== rsvpFilter) return false;
        if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (tagFilter.length > 0 && !tagFilter.some((t) => g.tags.includes(t))) {
          return false;
        }
        return true;
      });
  }, [guests, search, tagFilter, rsvpFilter]);

  const filteredRoster = useMemo(() => {
    return guests.filter((g) => {
      if (rsvpFilter !== "all" && g.rsvp_status !== rsvpFilter) return false;
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (tagFilter.length > 0 && !tagFilter.some((t) => g.tags.includes(t))) {
        return false;
      }
      return true;
    });
  }, [guests, search, tagFilter, rsvpFilter]);

  const seatedGuests = useMemo(
    () => guests.filter((g) => g.table_id),
    [guests],
  );

  const stats = useMemo(
    () => ({
      total: guests.length,
      confirmed: guests.filter((g) => g.rsvp_status === "confirmed").length,
      seated: seatedGuests.length,
      pending: guests.filter((g) => g.rsvp_status === "pending").length,
      declined: guests.filter((g) => g.rsvp_status === "declined").length,
    }),
    [guests, seatedGuests.length],
  );

  const tableLookup = useMemo(() => {
    const map = new Map<string, Table>();
    tables.forEach((t) => map.set(t.id, t));
    return map;
  }, [tables]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveGuest(null);

    const activeData = active.data.current as
      | { type?: string; tableId?: string; guest?: Guest }
      | undefined;

    // Table repositioning
    if (activeData?.type === "table") {
      const tableId = activeData.tableId!;
      const table = tableLookup.get(tableId);
      if (!table) return;
      const { delta } = event;
      const newX = table.pos_x + delta.x;
      const newY = table.pos_y + delta.y;
      handleTablePositionChange(tableId, newX, newY);
      updateTablePositionAction(tableId, newX, newY);
      return;
    }

    if (!over) return;

    const guestId = String(active.id);
    const overId = String(over.id);

    // Dropped back on the sidebar list (unassign)
    if (overId === "guest-pool" || overId.startsWith("guest-")) {
      await unassignGuestAction(guestId);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, table_id: null, seat_number: null } : g,
        ),
      );
      return;
    }

    // Seat drop: seat-{tableId}-{seatNumber}
    const seatMatch = overId.match(/^seat-(.+)-(\d+)$/);
    if (seatMatch) {
      const [, tableId, seatNumber] = seatMatch;
      const num = parseInt(seatNumber, 10);

      // Check if seat already occupied by another guest
      const occupant = guests.find(
        (g) => g.table_id === tableId && g.seat_number === num,
      );
      if (occupant && occupant.id !== guestId) {
        // Swap: move occupant to the guest's current seat (or unassign)
        const moving = guests.find((g) => g.id === guestId);
        const occupantTable = moving?.table_id ?? null;
        const occupantSeat = moving?.seat_number ?? null;

        await assignGuestToSeatAction(guestId, tableId, num);
        setGuests((prev) =>
          prev.map((g) =>
            g.id === guestId
              ? { ...g, table_id: tableId, seat_number: num }
              : g.id === occupant.id
                ? {
                    ...g,
                    table_id: occupantTable,
                    seat_number: occupantSeat,
                  }
                : g,
          ),
        );
        if (occupantTable) {
          await assignGuestToSeatAction(occupant.id, occupantTable, occupantSeat ?? 0);
        } else {
          await unassignGuestAction(occupant.id);
        }
        return;
      }

      await assignGuestToSeatAction(guestId, tableId, num);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, table_id: tableId, seat_number: num } : g,
        ),
      );
      return;
    }

    // Table drop (empty area): assign to first available seat
    const tableMatch = overId.match(/^table-(.+)$/);
    if (tableMatch) {
      const tableId = tableMatch[1];
      const table = tableLookup.get(tableId);
      if (!table) return;

      const occupied = new Set(
        guests
          .filter((g) => g.table_id === tableId && g.seat_number !== null)
          .map((g) => g.seat_number),
      );
      let seat = -1;
      for (let i = 0; i < table.capacity; i++) {
        if (!occupied.has(i)) {
          seat = i;
          break;
        }
      }
      if (seat === -1) return; // table full

      await assignGuestToSeatAction(guestId, tableId, seat);
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId ? { ...g, table_id: tableId, seat_number: seat } : g,
        ),
      );
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const guest = guests.find((g) => g.id === String(event.active.id));
    if (guest) setActiveGuest(guest);
  }

  function handleDragOver({ over }: DragOverEvent) {
    if (!over) return;
    const overId = String(over.id);
    if (overId === "guest-pool" || overId.startsWith("guest-")) {
      // Hovering over unassigned pool — show unassign feedback
    }
  }

  function handleTablePositionChange(tableId: string, pos_x: number, pos_y: number) {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, pos_x, pos_y } : t)),
    );
  }

  const handleGuestsImported = useCallback((newGuests: Guest[]) => {
    setGuests((prev) => {
      const uniqueGuests = newGuests.filter((guest) => !prev.some((item) => item.id === guest.id));
      return uniqueGuests.length === 0 ? prev : [...prev, ...uniqueGuests];
    });
  }, []);

  const handleSeated = useCallback(
    (plan: { guestId: string; tableId: string; seatNumber: number }[]) => {
      setGuests((prev) =>
        prev.map((g) => {
          const assignment = plan.find((a) => a.guestId === g.id);
          return assignment
            ? {
                ...g,
                table_id: assignment.tableId,
                seat_number: assignment.seatNumber,
              }
            : g;
        }),
      );
    },
    [],
  );

  const handleTableAdded = useCallback((table: Table) => {
    setTables((prev) => (prev.some((item) => item.id === table.id) ? prev : [...prev, table]));
  }, []);

  const handleGuestAdded = useCallback((guest: Guest) => {
    setGuests((prev) => (prev.some((item) => item.id === guest.id) ? prev : [guest, ...prev]));
  }, []);

  const handleCurrencyChange = useCallback(
    async (nextCurrency: CurrencyCode) => {
      const previousCurrency = currency;
      setCurrency(nextCurrency);

      try {
        const result = await updateEventCurrencyAction(
          initialEvent.id,
          nextCurrency,
        );

        if (result.error) {
          setCurrency(previousCurrency);
        }

        return result;
      } catch (error) {
        setCurrency(previousCurrency);
        throw error;
      }
    },
    [currency, initialEvent.id],
  );

  const eventContext = useMemo(
    () => ({
      eventId: initialEvent.id,
      eventName: initialEvent.name,
      eventType: initialEvent.event_type,
      date: initialEvent.date,
      totalGuests: stats.total,
      confirmedGuests: stats.confirmed,
      seatedGuests: stats.seated,
      tableCount: tables.length,
      tags: allTags,
      guests,
      tables,
    }),
    [initialEvent, stats, tables, allTags, guests],
  );

  return (
    <DndContext
      id={`event-${initialEvent.id}`}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="app-mesh relative flex h-screen flex-col overflow-hidden text-zinc-900">
        <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-200/70 bg-white/65 px-4 backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="group flex shrink-0 items-center gap-2.5"
              aria-label="Back to dashboard"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-600/25 transition-transform group-hover:-translate-y-0.5">
                <CalendarDays className="h-4 w-4" />
              </span>
              <span className="hidden text-sm font-semibold tracking-tight text-zinc-900 sm:block">
                EventPilot
              </span>
            </Link>

            <span className="hidden h-7 w-px bg-zinc-200/80 lg:block" />

            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="max-w-[34vw] truncate text-sm font-semibold tracking-tight text-zinc-950 sm:max-w-[42vw] lg:max-w-none">
                  {initialEvent.name}
                </h1>
                {initialEvent.event_type && (
                  <span className="hidden shrink-0 rounded-full border border-zinc-200/80 bg-white/70 px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-500 sm:inline-flex">
                    {initialEvent.event_type.replace(/_/g, " ")}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-400">
                <CalendarDays className="h-3 w-3 shrink-0" />
                <span className="truncate" suppressHydrationWarning>
                  {initialEvent.date
                    ? new Date(initialEvent.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Date not set"}
                </span>
                <span className="shrink-0 text-zinc-300">·</span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Users className="h-3 w-3" />
                  {stats.seated}/{stats.total} seated
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeTab === "seating" && tables.length > 0 && (
              <>
                <button
                  onClick={() => setAddTableOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white/80 px-3 text-xs font-medium text-zinc-700 shadow-sm shadow-zinc-950/5 transition-all hover:border-zinc-300 hover:bg-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add table</span>
                </button>
                {guests.length > 0 && (
                  <button
                    onClick={() => setAutoSeatOpen(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 text-xs font-medium text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Auto-seat with AI</span>
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        <main className="relative min-h-0 flex-1">
          <div className="flex h-full min-h-0">
            {activeTab === "overview" && (
              <WorkspaceOverview
                eventId={initialEvent.id}
                guests={guests}
                tables={tables}
                stats={stats}
                currency={currency}
                onNavigate={(view) => setActiveTab(view)}
                onAddGuest={() => setAddGuestOpen(true)}
                onAddTable={() => setAddTableOpen(true)}
                onOpenInvites={() => setInvitesOpen(true)}
              />
            )}

            {activeTab === "guests" && (
              <GuestRoster
                guests={filteredRoster}
                allGuestsCount={stats.total}
                tables={tables}
                stats={stats}
                search={search}
                onSearchChange={setSearch}
                tagFilter={tagFilter}
                onTagFilterChange={setTagFilter}
                allTags={allTags}
                rsvpFilter={rsvpFilter}
                onRsvpFilterChange={setRsvpFilter}
                onSmartPaste={() => setSmartPasteOpen(true)}
                onAddGuest={() => setAddGuestOpen(true)}
                onOpenInvites={() => setInvitesOpen(true)}
              />
            )}

            {activeTab === "seating" && (
              <>
                <GuestSidebar
                  guests={filteredGuests}
                  allGuestsCount={stats.total}
                  stats={stats}
                  search={search}
                  onSearchChange={setSearch}
                  tagFilter={tagFilter}
                  onTagFilterChange={setTagFilter}
                  allTags={allTags}
                  rsvpFilter={rsvpFilter}
                  onRsvpFilterChange={setRsvpFilter}
                  onSmartPaste={() => setSmartPasteOpen(true)}
                  onAddGuest={() => setAddGuestOpen(true)}
                  onOpenInvites={() => setInvitesOpen(true)}
                />
                <FloorPlanCanvas
                  tables={tables}
                  guests={guests}
                  onAddTable={() => setAddTableOpen(true)}
                />
              </>
            )}

            {activeTab === "budget" && (
              <div className="h-full min-w-0 flex-1 overflow-hidden">
                <BudgetTab
                  eventId={initialEvent.id}
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                />
              </div>
            )}
          </div>

          {isChatOpen && (
            <div className="absolute bottom-24 right-3 top-3 z-40 w-[min(380px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 shadow-2xl shadow-zinc-950/20 backdrop-blur-xl animate-soft-rise sm:right-4">
              <CoPilotChat
                open={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                context={eventContext}
              />
            </div>
          )}
        </main>

        <WorkspaceDock
          activeView={activeTab}
          copilotOpen={isChatOpen}
          onNavigate={setActiveTab}
          onToggleCopilot={() => setIsChatOpen((value) => !value)}
        />

        {/* Dialogs */}
        <SmartPasteDialog
          open={smartPasteOpen}
          onOpenChange={setSmartPasteOpen}
          eventId={initialEvent.id}
          onGuestsImported={handleGuestsImported}
        />

        <AutoSeatDialog
          open={autoSeatOpen}
          onOpenChange={setAutoSeatOpen}
          eventId={initialEvent.id}
          guests={guests}
          tables={tables}
          onSeated={handleSeated}
        />

        <AddTableDialog
          open={addTableOpen}
          onOpenChange={setAddTableOpen}
          eventId={initialEvent.id}
          onTableAdded={handleTableAdded}
        />

        <AddGuestDialog
          open={addGuestOpen}
          onOpenChange={setAddGuestOpen}
          eventId={initialEvent.id}
          onGuestAdded={handleGuestAdded}
        />

        <InvitesDialog
          open={invitesOpen}
          onOpenChange={setInvitesOpen}
          eventId={initialEvent.id}
          eventName={initialEvent.name}
          guests={guests}
        />

        <DragOverlay>
          {activeGuest ? (
            <div className="rounded-2xl border border-indigo-300 bg-white p-2 shadow-2xl shadow-indigo-950/20">
              <GuestCard guest={activeGuest} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}