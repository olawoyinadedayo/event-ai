import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("guests")
    .select("*, events(name, event_type, date)")
    .eq("invite_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid invitation link" }, { status: 404 });
  }

  return NextResponse.json({ error: null, data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createClient();

  const body = await req.json();
  const { rsvp_status, dietary_notes } = body;

  const updates: Record<string, string | null> = {};
  if (rsvp_status !== undefined) updates.rsvp_status = rsvp_status;
  if (dietary_notes !== undefined) updates.dietary_notes = dietary_notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("guests")
    .update(updates)
    .eq("invite_token", token)
    .select()
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null, data });
}