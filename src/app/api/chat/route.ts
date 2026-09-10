import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getGroqModel, GROQ_SMART_MODEL } from "@/lib/ai";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  eventId: string;
}

export async function POST(req: Request) {
  const model = getGroqModel(GROQ_SMART_MODEL);
  if (!model) {
    return Response.json(
      { error: "AI is not configured. Add your GROQ_API_KEY environment variable." },
      { status: 500 },
    );
  }

  const { messages, eventId } = (await req.json()) as ChatRequest;

  if (!eventId) {
    return Response.json({ error: "eventId is required" }, { status: 400 });
  }

  // Load event context server-side
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  const [{ data: guests }, { data: tables }] = await Promise.all([
    supabase.from("guests").select("*").eq("event_id", eventId),
    supabase.from("tables").select("*").eq("event_id", eventId),
  ]);

  if (!event) {
    return Response.json({ error: "Event not found" }, { status: 404 });
  }

  const guestCount = guests?.length ?? 0;
  const confirmedCount =
    guests?.filter((g) => g.rsvp_status === "confirmed").length ?? 0;
  const seatedCount = guests?.filter((g) => g.table_id).length ?? 0;
  const totalCapacity = tables?.reduce((sum, t) => sum + t.capacity, 0) ?? 0;
  const allTags = Array.from(
    new Set((guests ?? []).flatMap((g) => g.tags ?? [])),
  );

  const systemPrompt = `You are the Event Co-Pilot, an expert event planning assistant embedded in a seating & guest management app called EventPilot.

CURRENT EVENT CONTEXT:
- Name: ${event.name}
- Type: ${event.event_type ?? "not specified"}
- Date: ${event.date ? new Date(event.date).toLocaleString() : "not set"}
- Guests: ${guestCount} total, ${confirmedCount} confirmed, ${seatedCount} seated
- Tables: ${tables?.length ?? 0}, total capacity ${totalCapacity}
- Tags in use: ${allTags.length ? allTags.join(", ") : "none"}

CAPABILITIES:
- Suggest seating arrangements and resolve seating conflicts
- Generate event timelines (hour-by-minute itineraries)
- Recommend vendor categories and checklists
- Draft guest-communication messages
- Advise on event logistics, catering, and entertainment

FORMAT: Be concise and practical. Use bullet lists and short sections. When you produce a
timeline or checklist, use markdown so it renders cleanly. Ask clarifying questions when needed.
If asked about data outside the context above, say you only have visibility into this event's data.`;

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}