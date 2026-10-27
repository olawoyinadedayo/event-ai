"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY, isCurrencyCode } from "@/lib/currency";
import { redirect } from "next/navigation";

export async function createEventAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const event_type = String(formData.get("event_type") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "");
  const currency = String(formData.get("currency") ?? DEFAULT_CURRENCY)
    .trim()
    .toUpperCase();

  if (!name) return { error: "Event name is required." };
  if (!isCurrencyCode(currency)) {
    return { error: "Select a valid currency." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.name as string) ?? user.email ?? "",
      },
      { onConflict: "id" },
    );

  const date = dateRaw ? new Date(dateRaw).toISOString() : null;

  const { data, error } = await supabase
    .from("events")
    .insert({ user_id: user.id, name, event_type, date, currency })
    .select()
    .single();

  if (error) return { error: error.message };

  redirect(`/events/${data.id}`);
}