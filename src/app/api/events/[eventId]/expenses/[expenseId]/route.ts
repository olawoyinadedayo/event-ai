import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

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

  // Verify user owns the event through the expense
  const { data: expense } = await supabase
    .from("expenses")
    .select("id, events!inner(user_id)")
    .eq("id", expenseId)
    .eq("event_id", eventId)
    .single();

  if (!expense || (expense as any).events?.user_id !== user.id) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, category, estimated_cost, actual_cost, paid_status, notes } = body;

  const updates: Record<string, any> = {};
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

  // Verify user owns the event through the expense
  const { data: expense } = await supabase
    .from("expenses")
    .select("id, events!inner(user_id)")
    .eq("id", expenseId)
    .eq("event_id", eventId)
    .single();

  if (!expense || (expense as any).events?.user_id !== user.id) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null });
}