"use server";

import { generateObject, generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getGroqModel, aiUnavailableError } from "@/lib/ai";
import {
  ParseResultSchema,
  SeatingPlanSchema,
  type ParsedGuest,
} from "@/types/ai";
import type { RsvpStatus } from "@/types/database";

export async function parseGuestsFromTextAction(rawText: string) {
  const model = getGroqModel();
  if (!model) return aiUnavailableError();

  if (!rawText.trim()) {
    return { error: "Paste some text to parse.", data: null };
  }

  try {
    const { object } = await generateObject({
      model,
      schema: ParseResultSchema,
      system: `You are an expert guest-list data extractor for event planning.

Extract every distinct guest from the provided text. The text may be an email thread,
a chat log, a messy comma-separated list, "Name <email>" format, or a plain list.

Respond ONLY with a valid JSON object, using exactly this shape (no markdown, no commentary):
{
  "guests": [
    {
      "name": "Full Name",
      "email": "email@example.com or null",
      "rsvp_status": "confirmed" | "declined" | "pending",
      "dietary_notes": "text or null",
      "tags": ["string", ...]
    }
  ]
}

For each guest:
- name: full name (required). If only an email is present, use the local part as the name.
- email: email if present, otherwise null
- rsvp_status: "confirmed" if they clearly accepted, "declined" if they clearly declined, otherwise "pending"
- dietary_notes: dietary requirements or allergies if mentioned, otherwise null
- tags: meaningful groupings inferred from context (e.g. "Family", "Groom Side", "Bride Side", "College Friends", "Work"). Empty array if none.

Do not invent people. Do not include duplicates.`,
      prompt: rawText,
      temperature: 0.1,
    });

    return { error: null, data: object.guests };
  } catch (e) {
    try {
      const { text } = await generateText({
        model,
        system: `You are an expert guest-list data extractor. Extract every distinct guest from the provided text and return ONLY a valid JSON array of guest objects. No markdown, no commentary, no prose.

Each guest object must use exactly these keys:
{"name": "string", "email": "string or null", "rsvp_status": "confirmed"|"declined"|"pending", "dietary_notes": "string or null", "tags": ["string", ...]}

Rules:
- If only an email is present, use its local part as the name.
- rsvp_status is "confirmed" if they clearly accepted, "declined" if they clearly declined, otherwise "pending".
- tags are meaningful groupings inferred from context; empty array if none.
- Do not invent people. Do not include duplicates.`,
        prompt: rawText,
        temperature: 0.1,
      });

      const trimmed = text.trim();
      const jsonStart = trimmed.indexOf("[");
      const jsonEnd = trimmed.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const parsed = JSON.parse(trimmed.slice(jsonStart, jsonEnd + 1));
        const parsedGuests = ParseResultSchema.safeParse(parsed);
        if (parsedGuests.success && parsedGuests.data.guests.length > 0) {
          return { error: null, data: parsedGuests.data.guests };
        }
      }
      throw e;
    } catch {
      const message = e instanceof Error ? e.message : "Parsing failed";
      return { error: `AI parse failed: ${message}`, data: null };
    }
  }
}

export interface AutoSeatAssignment {
  guestId: string;
  tableId: string;
  seatNumber: number;
}

export async function generateSeatingPlanAction(
  eventId: string,
  userPrompt: string,
): Promise<{ error: string | null; data: AutoSeatAssignment[] | null }> {
  const model = getGroqModel();
  if (!model) return aiUnavailableError();

  const supabase = await createClient();

  const [{ data: unassigned }, { data: tables }] = await Promise.all([
    supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .is("table_id", null)
      .eq("rsvp_status", "confirmed"),
    supabase.from("tables").select("*").eq("event_id", eventId),
  ]);

  const [{ data: seated }] = await Promise.all([
    supabase
      .from("guests")
      .select("id, table_id, seat_number")
      .eq("event_id", eventId)
      .not("table_id", "is", null),
  ]);

  if (!tables || tables.length === 0) {
    return { error: "Add at least one table before auto-seating.", data: null };
  }

  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const seatedCount = seated?.length ?? 0;
  const availableCapacity = totalCapacity - seatedCount;
  const unassignedList = unassigned ?? [];

  if (unassignedList.length === 0) {
    return { error: "No confirmed, unassigned guests to seat.", data: null };
  }

  if (unassignedList.length > availableCapacity) {
    return {
      error: `Not enough seats: ${unassignedList.length} guests to seat but only ${availableCapacity} seats available. Add more tables or increase capacity.`,
      data: null,
    };
  }

  // Track current occupancy per table
  const occupiedByTable = new Map<string, number[]>();
  (seated ?? []).forEach((s) => {
    if (!s.table_id) return;
    const arr = occupiedByTable.get(s.table_id) ?? [];
    arr.push(s.seat_number ?? 0);
    occupiedByTable.set(s.table_id, arr);
  });

  const context = {
    unassignedGuests: unassignedList.map((g) => ({
      id: g.id,
      name: g.name,
      tags: g.tags,
      dietary_notes: g.dietary_notes,
    })),
    tables: tables.map((t) => ({
      id: t.id,
      name: t.name,
      capacity: t.capacity,
      occupiedSeats: occupiedByTable.get(t.id) ?? [],
    })),
  };

  try {
    const { object } = await generateObject({
      model,
      schema: SeatingPlanSchema,
      system: `You are an expert event seating planner.

Assign every provided guest to a table and seat following these rules:
1. NEVER exceed a table's capacity. A seat index is a 0-based number between 0 and capacity-1.
2. NEVER reuse a seat that is already occupied.
3. Assign every single guest exactly once.
4. Respect the user's instructions.
5. Group guests with shared tags together when it makes sense.
6. Prefer grouping guests with dietary restrictions together with others having the same restriction.
7. Output reasoning explaining the key decisions (short).

Return a JSON object with "assignments" (array of {guest_id, table_id, seat_number}) and "reasoning".`,
      prompt: `
DATA:
Unassigned guests: ${JSON.stringify(context.unassignedGuests)}
Tables (with occupied seats): ${JSON.stringify(context.tables)}
CURRENT OCCUPANCY: ${JSON.stringify(occupiedByTable)} seats already taken.

USER INSTRUCTIONS: "${userPrompt || "No special instructions — seat guests sensibly."}"`,
      temperature: 0.2,
    });

    // Validate assignments: every guest assigned, no capacity/seat conflicts
    const guestIds = new Set(context.unassignedGuests.map((g) => g.id));
    const tableMap = new Map(tables.map((t) => [t.id, t]));
    const seatRegistry = new Map<string, Set<number>>();
    const seenGuests = new Set<string>();
    const valid: AutoSeatAssignment[] = [];

    for (const a of object.assignments) {
      const table = tableMap.get(a.table_id);
      if (!table) continue;
      if (a.seat_number < 0 || a.seat_number >= table.capacity) continue;

      const seats = seatRegistry.get(a.table_id) ?? new Set<number>();
      if (seats.has(a.seat_number)) continue;
      const existing = (occupiedByTable.get(a.table_id) ?? []).some(
        (s) => s === a.seat_number,
      );
      if (existing) continue;

      if (!guestIds.has(a.guest_id) || seenGuests.has(a.guest_id)) continue;

      seats.add(a.seat_number);
      seatRegistry.set(a.table_id, seats);
      seenGuests.add(a.guest_id);
      valid.push({
        guestId: a.guest_id,
        tableId: a.table_id,
        seatNumber: a.seat_number,
      });
    }

    // Assign any guests the AI missed to remaining free seats
    const missed = context.unassignedGuests.filter((g) => !seenGuests.has(g.id));
    for (const guest of missed) {
      let placed = false;
      for (const table of tables) {
        const used = new Set(occupiedByTable.get(table.id) ?? []);
        (seatRegistry.get(table.id) ?? []).forEach((s) => used.add(s));
        for (let i = 0; i < table.capacity; i++) {
          if (!used.has(i)) {
            used.add(i);
            seatRegistry.set(table.id, used);
            valid.push({ guestId: guest.id, tableId: table.id, seatNumber: i });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }

    return { error: null, data: valid };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI seating failed";
    return { error: `AI seating failed: ${message}`, data: null };
  }
}

export async function applySeatingPlanAction(assignments: AutoSeatAssignment[]) {
  const supabase = await createClient();

  for (const a of assignments) {
    const { error } = await supabase
      .from("guests")
      .update({ table_id: a.tableId, seat_number: a.seatNumber })
      .eq("id", a.guestId);
    if (error) return { error: error.message };
  }
  return { error: null };
}

export async function bulkAddParsedGuestsAction(
  eventId: string,
  guests: ParsedGuest[],
) {
  const supabase = await createClient();
  const rows = guests.map((g) => ({
    event_id: eventId,
    name: g.name,
    email: g.email ?? null,
    rsvp_status: (g.rsvp_status ?? "pending") as RsvpStatus,
    dietary_notes: g.dietary_notes ?? null,
    tags: g.tags ?? [],
  }));

  const { error } = await supabase.from("guests").insert(rows);
  if (error) return { error: error.message };
  return { error: null };
}