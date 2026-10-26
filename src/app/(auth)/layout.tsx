import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "EventPilot — AI Event Planning",
  description:
    "Collaborative guest lists, drag-and-drop seating charts, and AI-powered event planning.",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-mesh relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-5 flex w-fit items-center gap-2.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-600/25">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-zinc-950">
            EventPilot
          </span>
        </Link>

        {children}

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
          <Sparkles className="h-3 w-3 text-violet-400" />
          AI-powered guest lists, seating, and budgets
        </p>
      </div>
    </div>
  );
}
