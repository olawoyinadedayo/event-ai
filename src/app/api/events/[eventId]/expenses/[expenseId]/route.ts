import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { NextRequest, NextResponse } from "next/server";

type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; expenseId: string }> },
) {
  const { eventId, expenseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const { data: expense } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", expenseId)
    .eq("event_id", eventId)
    .single();

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, category, estimated_cost, actual_cost, paid_status, notes } = body;

  const updates: ExpenseUpdate = {};
  if (title !== undefined) updates.title = title;
  if (category !== undefined) updates.category = category;
  if (estimated_cost !== undefined) updates.estimated_cost = estimated_cost;
  if (actual_cost !== undefined) updates.actual_cost = actual_cost;
  if (paid_status !== undefined) updates.paid_status = paid_status;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", expenseId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null, data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; expenseId: string }> },
) {
  const { eventId, expenseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const { data: expense } = await supabase
    .from("expenses")
    .select("id")
    .eq("id", expenseId)
    .eq("event_id", eventId)
    .single();

  if (!expense) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null });
}