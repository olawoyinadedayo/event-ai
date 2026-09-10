import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; guestId: string }> },
) {
  const { eventId, guestId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify user owns the event through the guest
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("id, events!inner(user_id)")
    .eq("id", guestId)
    .eq("event_id", eventId)
    .single();

  if (guestError || !guest || guest.events?.user_id !== user.id) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("guests")
    .update({ invite_sent: true, invite_sent_at: new Date().toISOString() })
    .eq("id", guestId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: null });
}