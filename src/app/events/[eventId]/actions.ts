"use server";

import { createClient } from "@/lib/supabase/server";
import type { RsvpStatus, TableShape, ExpenseCategory } from "@/types/database";

export async function addGuestAction(
  eventId: string,
  guest: {
    name: string;
    email?: string | null;
    rsvp_status?: RsvpStatus;
    dietary_notes?: string | null;
    tags?: string[];
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").insert({
    event_id: eventId,
    name: guest.name,
    email: guest.email ?? null,
    rsvp_status: guest.rsvp_status ?? "pending",
    dietary_notes: guest.dietary_notes ?? null,
    tags: guest.tags ?? [],
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function bulkAddGuestsAction(
  eventId: string,
  guests: {
    name: string;
    email?: string | null;
    rsvp_status?: RsvpStatus;
    dietary_notes?: string | null;
    tags?: string[];
  }[],
) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").insert(
    guests.map((g) => ({
      event_id: eventId,
      name: g.name,
      email: g.email ?? null,
      rsvp_status: g.rsvp_status ?? "pending",
      dietary_notes: g.dietary_notes ?? null,
      tags: g.tags ?? [],
    })),
  );

  if (error) return { error: error.message };
  return { error: null };
}

export async function addTableAction(
  eventId: string,
  table: {
    name: string;
    shape: TableShape;
    capacity: number;
    pos_x: number;
    pos_y: number;
  },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .insert({
      event_id: eventId,
      name: table.name,
      shape: table.shape,
      capacity: table.capacity,
      pos_x: table.pos_x,
      pos_y: table.pos_y,
    })
    .select()
    .single();

  if (error) return { error: error.message, data: null };
  return { error: null, data };
}

export async function updateTablePositionAction(tableId: string, pos_x: number, pos_y: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tables")
    .update({ pos_x, pos_y })
    .eq("id", tableId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function updateTableAction(
  tableId: string,
  updates: { name?: string; shape?: TableShape; capacity?: number },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tables").update(updates).eq("id", tableId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteTableAction(tableId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tables").delete().eq("id", tableId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteGuestAction(guestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", guestId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function assignGuestToSeatAction(
  guestId: string,
  tableId: string,
  seatNumber: number,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ table_id: tableId, seat_number: seatNumber })
    .eq("id", guestId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function unassignGuestAction(guestId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ table_id: null, seat_number: null })
    .eq("id", guestId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function updateGuestAction(
  guestId: string,
  updates: {
    name?: string;
    email?: string | null;
    rsvp_status?: RsvpStatus;
    dietary_notes?: string | null;
    tags?: string[];
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").update(updates).eq("id", guestId);

  if (error) return { error: error.message };
  return { error: null };
}

// Expense actions
export async function getExpensesAction(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, data: null };
  return { error: null, data };
}

export async function addExpenseAction(
  eventId: string,
  expense: {
    title: string;
    category: ExpenseCategory;
    estimated_cost?: number;
    actual_cost?: number;
    paid_status?: boolean;
    notes?: string | null;
  },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      event_id: eventId,
      title: expense.title,
      category: expense.category,
      estimated_cost: expense.estimated_cost ?? 0,
      actual_cost: expense.actual_cost ?? 0,
      paid_status: expense.paid_status ?? false,
      notes: expense.notes ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message, data: null };
  return { error: null, data };
}

export async function updateExpenseAction(
  expenseId: string,
  updates: {
    title?: string;
    category?: ExpenseCategory;
    estimated_cost?: number;
    actual_cost?: number;
    paid_status?: boolean;
    notes?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").update(updates).eq("id", expenseId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteExpenseAction(expenseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) return { error: error.message };
  return { error: null };
}

// Invite actions
export async function sendInviteAction(guestId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
    .eq("id", guestId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function bulkSendInvitesAction(guestIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
    .in("id", guestIds);

  if (error) return { error: error.message };
  return { error: null };
}

export async function getGuestByTokenAction(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*, events(name, event_type, date)")
    .eq("invite_token", token)
    .single();

  if (error) return { error: error.message, data: null };
  return { error: null, data };
}

export async function updateGuestRsvpAction(
  token: string,
  updates: {
    rsvp_status?: RsvpStatus;
    dietary_notes?: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").update(updates).eq("invite_token", token);

  if (error) return { error: error.message };
  return { error: null };
}