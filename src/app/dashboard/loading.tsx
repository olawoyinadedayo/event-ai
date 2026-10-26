import { CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div
      className="app-mesh min-h-screen text-zinc-900"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <span className="sr-only">Loading your dashboard…</span>

      <header className="sticky top-0 z-20 border-b border-zinc-200/70 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-600/25">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              EventPilot
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/70 px-2.5 py-1.5 sm:flex">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-9 sm:px-6 lg:pt-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-6 w-36 rounded-full" />
            <Skeleton className="mt-4 h-10 w-80 max-w-full" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3.5 w-[28rem] max-w-full" />
              <Skeleton className="h-3.5 w-80 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 shrink-0 rounded-xl" />
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bento-card flex items-center gap-4 rounded-2xl p-4"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-2.5 w-28" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-3 w-60" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bento-card rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
              <Skeleton className="mt-5 h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <div className="mt-5 flex items-center gap-4 border-t border-zinc-100 pt-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
