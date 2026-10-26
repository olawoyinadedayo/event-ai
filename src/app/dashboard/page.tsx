import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { LoadDemoEventButton } from "./LoadDemoEventButton";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  LogOut,
  Plus,
  Sparkles,
  Table2,
  Users,
} from "lucide-react";

function countRelation(value: unknown) {
  if (!Array.isArray(value)) return 0;
  const first = value[0] as { count?: number } | undefined;
  return typeof first?.count === "number" ? first.count : value.length;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: events }, { data: profile }] = await Promise.all([
    supabase
      .from("events")
      .select("*, tables(count), guests(count)")
      .eq("user_id", user?.id ?? "")
      .order("date", { ascending: true }),
    supabase
      .from("users")
      .select("name, role")
      .eq("id", user?.id ?? "")
      .single(),
  ]);

  const totalGuests =
    events?.reduce((sum, event) => sum + countRelation(event.guests), 0) ?? 0;
  const totalTables =
    events?.reduce((sum, event) => sum + countRelation(event.tables), 0) ?? 0;
  const displayName = profile?.name ?? user?.email?.split("@")[0] ?? "there";
  const firstName = displayName.split(" ")[0];
  const hasEvents = Boolean(events?.length);

  return (
    <div className="app-mesh min-h-screen text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-600/25 transition-transform group-hover:-translate-y-0.5">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              EventPilot
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-2.5 py-1.5 shadow-sm shadow-zinc-950/[0.02] sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-50 text-[10px] font-semibold text-indigo-700">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="max-w-[160px] truncate text-xs font-medium text-zinc-800">
                  {profile?.name ?? user?.email}
                </p>
                <p className="text-[10px] capitalize text-zinc-400">
                  {profile?.role?.replace(/_/g, " ") ?? "Planner"}
                </p>
              </div>
            </div>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                className="text-zinc-400 hover:text-zinc-900"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-9 sm:px-6 lg:pt-12">
        <div className="animate-soft-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-indigo-600 shadow-sm shadow-indigo-950/5">
              <Sparkles className="h-3 w-3" />
              Event workspace
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
              Good to see you, {firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Plan the guest list, design the room, and keep the budget on
              track — all from one focused workspace.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
            {hasEvents && <LoadDemoEventButton />}
            <Link href="/events/new" className="shrink-0">
              <Button size="lg" className="shadow-lg shadow-indigo-600/20">
                <Plus className="h-4 w-4" />
                New event
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Events planned",
              value: events?.length ?? 0,
              icon: CalendarDays,
              tone: "bg-indigo-50 text-indigo-600",
            },
            {
              label: "Guests managed",
              value: totalGuests,
              icon: Users,
              tone: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Tables designed",
              value: totalTables,
              icon: Table2,
              tone: "bg-violet-50 text-violet-600",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bento-card animate-soft-rise flex items-center gap-4 rounded-2xl p-4"
                style={{ animationDelay: `${80 + index * 50}ms` }}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${stat.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                    {stat.value}
                  </div>
                  <p className="text-[11px] text-zinc-400">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              Your events
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {events?.length
                ? `${events.length} workspace${events.length === 1 ? "" : "s"} ready for planning`
                : "Start with your first event workspace"}
            </p>
          </div>
        </div>

        {!hasEvents && (
          <div className="animate-soft-rise mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200/80 bg-white/60 px-6 py-16 text-center shadow-sm shadow-indigo-950/[0.03] backdrop-blur-sm">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-600/25">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold text-zinc-900">
              See EventPilot in action
            </h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-zinc-500">
              Load a ready-made wedding with five guests, a seating table, and
              budget items — no setup required.
            </p>
            <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
              <LoadDemoEventButton />
              <Link href="/events/new">
                <Button type="button" size="lg" variant="outline">
                  <Plus className="h-4 w-4" />
                  Create your own
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events?.map((event, index) => {
            const guestCount = countRelation(event.guests);
            const tableCount = countRelation(event.tables);
            const date = event.date ? new Date(event.date) : null;

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bento-card animate-soft-rise group rounded-2xl p-5"
                style={{ animationDelay: `${140 + index * 45}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-sm shadow-indigo-950/[0.03]">
                    {date ? (
                      <>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-indigo-400">
                          {date.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span
                          className="text-xl font-semibold leading-none text-indigo-700"
                          suppressHydrationWarning
                        >
                          {date.getDate()}
                        </span>
                      </>
                    ) : (
                      <CalendarDays className="h-5 w-5 text-indigo-400" />
                    )}
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-zinc-200/80 bg-white text-zinc-300 transition-all group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <h3 className="mt-4 truncate text-base font-semibold tracking-tight text-zinc-900 transition-colors group-hover:text-indigo-700">
                  {event.name}
                </h3>
                <p className="mt-1 text-xs capitalize text-zinc-400">
                  {event.event_type
                    ? event.event_type.replace(/_/g, " ")
                    : "Event"}
                  {event.date && (
                    <span suppressHydrationWarning>
                      {" · "}
                      {date?.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </p>

                <div className="mt-5 flex items-center gap-4 border-t border-zinc-100 pt-3 text-[11px] text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-400" />
                    <strong className="font-semibold text-zinc-700">
                      {guestCount}
                    </strong>
                    guests
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Table2 className="h-3.5 w-3.5 text-violet-400" />
                    <strong className="font-semibold text-zinc-700">
                      {tableCount}
                    </strong>
                    tables
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
