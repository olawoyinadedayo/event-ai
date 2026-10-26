"use client";

import {
  LayoutDashboard,
  LayoutGrid,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceView = "overview" | "guests" | "seating" | "budget";

interface WorkspaceDockProps {
  activeView: WorkspaceView;
  copilotOpen: boolean;
  onNavigate: (view: WorkspaceView) => void;
  onToggleCopilot: () => void;
}

const items = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "guests", label: "Guests", icon: Users },
  { id: "seating", label: "Seating", icon: LayoutGrid },
  { id: "budget", label: "Budget", icon: Wallet },
] satisfies Array<{
  id: WorkspaceView;
  label: string;
  icon: React.ElementType;
}>;

export function WorkspaceDock({
  activeView,
  copilotOpen,
  onNavigate,
  onToggleCopilot,
}: WorkspaceDockProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-5">
      <nav
        aria-label="Workspace navigation"
        className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/85 p-1.5 shadow-[0_20px_60px_-20px_rgba(24,24,27,0.42)] backdrop-blur-xl"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-all duration-200 sm:px-3",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-white" : "text-zinc-400",
                )}
              />
              <span className="hidden sm:inline">{item.label}</span>
              {active && (
                <span className="absolute -bottom-0.5 left-1/2 hidden h-1 w-1 -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_8px_2px_rgba(255,255,255,0.75)] sm:block" />
              )}
            </button>
          );
        })}

        <span className="mx-1 h-6 w-px bg-zinc-200/90" aria-hidden />

        <button
          type="button"
          onClick={onToggleCopilot}
          aria-pressed={copilotOpen}
          className={cn(
            "relative inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-all duration-200 sm:px-3",
            copilotOpen
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-zinc-500 hover:bg-indigo-50 hover:text-indigo-700",
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4",
              copilotOpen ? "text-white" : "text-violet-500",
            )}
          />
          <span className="hidden sm:inline">Co-Pilot</span>
          {copilotOpen && (
            <span className="absolute -bottom-0.5 left-1/2 hidden h-1 w-1 -translate-x-1/2 rounded-full bg-white/90 shadow-[0_0_8px_2px_rgba(255,255,255,0.75)] sm:block" />
          )}
        </button>
      </nav>
    </div>
  );
}
