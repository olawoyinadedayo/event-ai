"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory, RsvpStatus } from "@/types/database";

interface DemoGuest {
  name: string;
  email: string;
  rsvp_status: RsvpStatus;
  dietary_notes: string | null;
  tags: string[];
  seat_number?: number;
  invite_sent: boolean;
}

const demoGuests: DemoGuest[] = [
  {
    name: "Maya Thompson",
    email: "maya.thompson@example.com",
    rsvp_status: "confirmed",
    dietary_notes: "Vegetarian",
    tags: ["Bride Side", "College"],
    seat_number: 0,
    invite_sent: true,
  },
  {
    name: "David Okafor",
    email: "david.okafor@example.com",
    rsvp_status: "confirmed",
    dietary_notes: null,
    tags: ["Groom Side"],
    seat_number: 1,
    invite_sent: true,
  },
  {
    name: "Noah Williams",
    email: "noah.williams@example.com",
    rsvp_status: "confirmed",
    dietary_notes: "Nut allergy",
    tags: ["Family"],
    seat_number: 2,
    invite_sent: true,
  },
  {
    name: "Olivia Chen",
    email: "olivia.chen@example.com",
    rsvp_status: "pending",
    dietary_notes: "Gluten free",
    tags: ["Work"],
    invite_sent: false,
  },
  {
    name: "Amara Patel",
    email: "amara.patel@example.com",
    rsvp_status: "pending",
    dietary_notes: "Vegan",
    tags: ["Bride Side", "Family"],
    invite_sent: false,
  },
];

const demoExpenses: Array<{
  title: string;
  category: ExpenseCategory;
  estimated_cost: number;
  actual_cost: number;
  paid_status: boolean;
  notes: string;
}> = [
  {
    title: "Venue deposit",
    category: "Venue",
    estimated_cost: 8000,
    actual_cost: 2500,
    paid_status: true,
    notes: "Deposit paid to reserve the venue.",
  },
  {
    title: "Catering",
    category: "Catering",
    estimated_cost: 4200,
    actual_cost: 0,
    paid_status: false,
    notes: "Final headcount due two weeks before the wedding.",
  },
  {
    title: "Photography",
    category: "Photography",
    estimated_cost: 1800,
    actual_cost: 600,
    paid_status: true,
    notes: "Booking retainer paid.",
  },
];

export async function loadDemoEventAction() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Please sign in again to load the demo event." };
  }

  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 90);
  eventDate.setHours(17, 0, 0, 0);

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      name: "Sarah & Alex's Wedding",
      event_type: "wedding",
      date: eventDate.toISOString(),
    })
    .select("id")
    .single();

  if (eventError || !event) {
    return {
      error: eventError?.message ?? "Could not create the demo event.",
    };
  }

  const demoEventId = event.id;

  async function removeDemoEvent() {
    await supabase.from("events").delete().eq("id", demoEventId);
  }

  const { data: table, error: tableError } = await supabase
    .from("tables")
    .insert({
      event_id: event.id,
      name: "Table 1",
      shape: "round",
      capacity: 8,
      pos_x: 620,
      pos_y: 520,
    })
    .select("id")
    .single();

  if (tableError || !table) {
    await removeDemoEvent();
    return {
      error: tableError?.message ?? "Could not add the demo table.",
    };
  }

  const inviteSentAt = new Date().toISOString();

  const [guestResult, expenseResult] = await Promise.all([
    supabase.from("guests").insert(
      demoGuests.map((guest) => ({
        event_id: event.id,
        name: guest.name,
        email: guest.email,
        rsvp_status: guest.rsvp_status,
        dietary_notes: guest.dietary_notes,
        tags: guest.tags,
        table_id: guest.seat_number === undefined ? null : table.id,
        seat_number: guest.seat_number ?? null,
        invite_sent: guest.invite_sent,
        invite_sent_at: guest.invite_sent ? inviteSentAt : null,
      })),
    ),
    supabase.from("expenses").insert(
      demoExpenses.map((expense) => ({
        event_id: event.id,
        ...expense,
      })),
    ),
  ]);

  if (guestResult.error || expenseResult.error) {
    await removeDemoEvent();
    return {
      error:
        guestResult.error?.message ??
        expenseResult.error?.message ??
        "Could not finish creating the demo event.",
    };
  }

  revalidatePath("/dashboard");
  redirect(`/events/${event.id}`);
}
