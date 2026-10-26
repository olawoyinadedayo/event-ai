import {
  CalendarDays,
  LayoutGrid,
  Maximize,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const seatDots = Array.from({ length: 8 }).map((_, index) => {
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  return {
    left: `${50 + 39 * Math.cos(angle)}%`,
    top: `${50 + 39 * Math.sin(angle)}%`,
  };
});

export default function EventWorkspaceLoading() {
  return (
    <div
      className="app-mesh relative flex h-screen flex-col overflow-hidden text-zinc-900"
      role="status"
      aria-busy="true"
      aria-label="Loading event workspace"
    >
      <span className="sr-only">Loading event workspace…</span>

      <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-zinc-200/70 bg-white/65 px-4 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-600/25">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="hidden text-sm font-semibold tracking-tight text-zinc-900 sm:block">
              EventPilot
            </span>
          </div>

          <span className="hidden h-7 w-px bg-zinc-200/80 lg:block" />

          <div className="min-w-0">
            <Skeleton className="h-4 w-40 max-w-[34vw] sm:w-52" />
            <div className="mt-2 flex items-center gap-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <div className="flex h-full min-h-0">
          <aside className="hidden w-[332px] shrink-0 flex-col border-r border-zinc-200/70 bg-white/70 p-4 backdrop-blur-sm lg:flex">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-zinc-100 bg-white/70 p-2.5"
                >
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="mt-1.5 h-2 w-12" />
                </div>
              ))}
            </div>

            <Skeleton className="mt-4 h-9 w-full rounded-xl" />

            <div className="mt-3 flex gap-1.5">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>

            <div className="mt-4 flex-1 space-y-2 overflow-hidden">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-white/75 p-2.5"
                >
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-6 shrink-0 rounded-lg" />
                </div>
              ))}
            </div>

            <Skeleton className="mt-3 h-9 w-full rounded-xl" />
          </aside>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div className="canvas-grid pointer-events-none absolute inset-0 opacity-70" />

            <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/80 px-2.5 py-1.5 shadow-sm backdrop-blur-md">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-50 text-indigo-600">
                <LayoutGrid className="h-3 w-3" />
              </span>
              <Skeleton className="h-2.5 w-16" />
              <span className="h-3 w-px bg-zinc-200" />
              <Skeleton className="h-2.5 w-12" />
            </div>

            <div className="absolute left-4 top-[3.75rem] z-10 hidden rounded-xl border border-zinc-200/70 bg-white/75 px-3 py-1.5 lg:block">
              <Skeleton className="h-2.5 w-80" />
            </div>

            <div className="absolute right-4 top-4 z-10 flex flex-col items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/85 p-1.5 shadow-lg backdrop-blur-md">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300">
                <ZoomIn className="h-3.5 w-3.5" />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300">
                <ZoomOut className="h-3.5 w-3.5" />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300">
                <Maximize className="h-3.5 w-3.5" />
              </span>
              <Skeleton className="my-1 h-2.5 w-8" />
            </div>

            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute inset-0">
                {seatDots.map((position, index) => (
                  <Skeleton
                    key={index}
                    className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm ring-1 ring-zinc-200/80"
                    style={position}
                  />
                ))}
              </div>
              <Skeleton className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 ring-1 ring-zinc-200/80" />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 w-12" />
              </div>
            </div>

            <div className="absolute bottom-28 right-8 hidden rounded-2xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur-md xl:block">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-2.5 w-28" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
              <Skeleton className="mt-3 h-2 w-44 rounded-full" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-5">
          <nav className="flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/85 p-1.5 shadow-[0_20px_60px_-20px_rgba(24,24,27,0.42)] backdrop-blur-xl">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-9 w-10 rounded-xl sm:w-20"
              />
            ))}
            <span className="mx-1 h-6 w-px bg-zinc-200/90" />
            <Skeleton className="h-9 w-10 rounded-xl sm:w-20" />
          </nav>
        </div>
      </main>
    </div>
  );
}
