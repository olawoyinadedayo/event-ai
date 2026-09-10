"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
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
import { GuestSidebar } from "./GuestSidebar";
import { FloorPlanCanvas } from "./FloorPlanCanvas";
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
  updateTablePositionAction,
} from "../actions";
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Users,
  DollarSign,
  Mail,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventWorkspaceProps {
  initialEvent: Event;
  initialGuests: Guest[];
  initialTables: Table[];
}

type ActiveTab = "guests" | "budget" | "canvas";

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
  const [activeTab, setActiveTab] = useState<ActiveTab>("guests");
  const [isMounted, setIsMounted] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    setGuests((prev) => [...prev, ...newGuests]);
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
    setTables((prev) => [...prev, table]);
  }, []);

  const handleGuestAdded = useCallback((guest: Guest) => {
    setGuests((prev) => [guest, ...prev]);
  }, []);

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
    isMounted ? (
      <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        {/* Left sidebar - Guests or Budget */}
        {activeTab === "budget" ? (
          <BudgetTab eventId={initialEvent.id} />
        ) : (
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
        )}

        {/* Canvas / Budget area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">
            <div className="flex min-w-0 items-center gap-2">
              {activeTab === "budget" ? (
                <DollarSign className="h-4 w-4 shrink-0 text-zinc-400" />
              ) : (
                <LayoutDashboard className="h-4 w-4 shrink-0 text-zinc-400" />
              )}
              <h1 className="truncate text-sm font-semibold text-zinc-900">
                {initialEvent.name}
              </h1>
              <span className="hidden items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 sm:flex">
                <Users className="h-3 w-3" />
                {stats.seated}/{stats.total} seated
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Tab Navigation */}
              <div className="flex bg-zinc-100 rounded-md p-1">
                <button
                  onClick={() => setActiveTab("guests")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeTab === "guests"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900",
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  Guests
                </button>
                <button
                  onClick={() => setActiveTab("budget")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    activeTab === "budget"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900",
                  )}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Budget
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab !== "budget" && (
                  <>
                    <button
                      onClick={() => setAddTableOpen(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      + Add Table
                    </button>
                    <button
                      onClick={() => setAutoSeatOpen(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Auto-Seat with AI
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsChatOpen((v) => !v)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                    isChatOpen
                      ? "bg-indigo-100 text-indigo-700"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Co-Pilot
                </button>
                </div>
              </div>
            </header>

            {activeTab === "budget" ? (
              <div className="flex-1 overflow-hidden">
                <BudgetTab eventId={initialEvent.id} />
              </div>
            ) : (
              <FloorPlanCanvas tables={tables} guests={guests} />
            )}
          </div>

          {/* Co-Pilot chat drawer */}
          <CoPilotChat
            open={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            context={eventContext}
          />

          {/* Overlay while dragging */}
          <DragOverlay>
            {activeGuest ? (
              <div className="rounded-lg border border-indigo-300 bg-white p-2 shadow-lg">
                <GuestCard guest={activeGuest} />
              </div>
            ) : null}
          </DragOverlay>
        </div>

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
      </DndContext>
    ) : (
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        <div className="flex w-[320px] shrink-0 flex-col border-r border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">Guests</h2>
              <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 animate-pulse">
                {stats.total} guests
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="animate-pulse space-y-4 w-full max-w-xs">
                <div className="h-16 rounded-lg bg-zinc-100" />
                <div className="h-16 rounded-lg bg-zinc-100" />
                <div className="h-16 rounded-lg bg-zinc-100" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4">
            <div className="flex min-w-0 items-center gap-2">
              <LayoutDashboard className="h-4 w-4 shrink-0 text-zinc-400" />
              <h1 className="truncate text-sm font-semibold text-zinc-900">{initialEvent.name}</h1>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center bg-zinc-50">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              <div className="h-32 rounded-lg bg-zinc-100" />
              <div className="h-32 rounded-lg bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    )
  );
}