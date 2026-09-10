import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, LogOut, CalendarDays } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("*, tables(count), guests(count)")
    .eq("user_id", user?.id ?? "")
    .order("date", { ascending: true });

  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold text-zinc-900">EventPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              {profile?.name ?? user?.email}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Your events</h1>
            <p className="text-sm text-zinc-500">
              {events?.length ?? 0} event{events?.length === 1 ? "" : "s"} planned
            </p>
          </div>
          <Link href="/events/new">
            <Button>
              <Plus className="h-4 w-4" />
              New event
            </Button>
          </Link>
        </div>

        {(!events || events.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-20 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Plus className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">Create your first event</h2>
            <p className="mt-1 max-w-sm text-sm text-zinc-500">
              Build a guest list, design a seating chart, and let AI handle the rest.
            </p>
            <Link href="/events/new" className="mt-6">
              <Button size="lg">Get started</Button>
            </Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-zinc-900 group-hover:text-indigo-600">
                {event.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {event.event_type
                  ? event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)
                  : "Event"}
                {event.date ? (
                  <span suppressHydrationWarning>
                    {" "}
                    ·{" "}
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  ""
                )}
              </p>
              <div className="mt-4 flex gap-4 text-xs text-zinc-500">
                <span>
                  <strong className="text-zinc-900">
                    {Array.isArray(event.guests) ? event.guests.length : 0}
                  </strong>{" "}
                  guests
                </span>
                <span>
                  <strong className="text-zinc-900">
                    {Array.isArray(event.tables) ? event.tables.length : 0}
                  </strong>{" "}
                  tables
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}