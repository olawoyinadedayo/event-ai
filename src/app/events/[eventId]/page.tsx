import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventWorkspace } from "./workspace/EventWorkspace";

export const metadata: Metadata = {
  title: "Event Workspace — EventPilot",
};

export default async function EventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [{ data: event }, { data: guests }, { data: tables }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle(),
    supabase
      .from("guests")
      .select("*")
      .eq("event_id", eventId)
      .order("name", { ascending: true }),
    supabase.from("tables").select("*").eq("event_id", eventId),
  ]);

  if (!event || event.user_id !== user.id) notFound();

  return (
    <EventWorkspace
      initialEvent={event}
      initialGuests={guests ?? []}
      initialTables={tables ?? []}
    />
  );
}