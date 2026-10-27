"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  LayoutGrid,
  Send,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import type { Expense, Guest, Table } from "@/types/app";
import type { CurrencyCode } from "@/types/database";

interface OverviewStats {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  seated: number;
}

interface WorkspaceOverviewProps {
  eventId: string;
  guests: Guest[];
  tables: Table[];
  stats: OverviewStats;
  currency: CurrencyCode;
  onNavigate: (view: "guests" | "seating" | "budget") => void;
  onAddGuest: () => void;
  onAddTable: () => void;
  onOpenInvites: () => void;
}

interface NextStep {
  icon: ElementType;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function WorkspaceOverview({
  eventId,
  guests,
  tables,
  stats,
  currency,
  onNavigate,
  onAddGuest,
  onAddTable,
  onOpenInvites,
}: WorkspaceOverviewProps) {
  const [budget, setBudget] = useState<{
    estimated: number;
    actual: number;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBudget() {
      try {
        const response = await fetch(`/api/events/${eventId}/expenses`);
        const result = (await response.json()) as {
          data?: Expense[] | null;
          error?: string | null;
        };

        if (!active) return;

        if (result.error || !Array.isArray(result.data)) {
          setBudget({ estimated: 0, actual: 0 });
          return;
        }

        setBudget({
          estimated: result.data.reduce(
            (sum, expense) => sum + Number(expense.estimated_cost),
            0,
          ),
          actual: result.data.reduce(
            (sum, expense) => sum + Number(expense.actual_cost),
            0,
          ),
        });
      } catch {
        if (active) setBudget({ estimated: 0, actual: 0 });
      }
    }

    loadBudget();

    return () => {
      active = false;
    };
  }, [eventId]);

  const totalSeats = useMemo(
    () => tables.reduce((sum, table) => sum + table.capacity, 0),
    [tables],
  );

  const seatedPercent = percent(stats.seated, stats.total);
  const confirmedPercent = percent(stats.confirmed, stats.total);
  const budgetPercent = budget
    ? percent(budget.actual, budget.estimated)
    : 0;
  const unseated = Math.max(stats.total - stats.seated, 0);
  const uninvited = guests.filter((guest) => !guest.invite_sent).length;

  let nextStep: NextStep;

  if (stats.total === 0) {
    nextStep = {
      icon: UserPlus,
      title: "Build your guest list",
      description:
        "Add guests manually or paste an existing list to get the workspace moving.",
      action: {
        label: "Add guests",
        onClick: onAddGuest,
      },
    };
  } else if (tables.length === 0) {
    nextStep = {
      icon: LayoutGrid,
      title: "Create your first seating table",
      description: `${countLabel(stats.total, "guest")} are ready to seat. Add a table to start designing the floor plan.`,
      action: {
        label: "Add a table",
        onClick: onAddTable,
      },
    };
  } else if (unseated > 0) {
    nextStep = {
      icon: LayoutGrid,
      title: `${countLabel(unseated, "guest")} still need${unseated === 1 ? "s" : ""} seating`,
      description: `${stats.seated} of ${stats.total} guests are seated. Finish the chart before final details go out.`,
      action: {
        label: "Open seating",
        onClick: () => onNavigate("seating"),
      },
    };
  } else if (uninvited > 0) {
    nextStep = {
      icon: Send,
      title: `${countLabel(uninvited, "invitation")} ${uninvited === 1 ? "has" : "have"} not been sent`,
      description:
        "Send invitations and collect RSVPs without leaving the workspace.",
      action: {
        label: "Open invites",
        onClick: onOpenInvites,
      },
    };
  } else if (stats.pending > 0) {
    nextStep = {
      icon: Users,
      title: `${countLabel(stats.pending, "RSVP")} still pending`,
      description:
        "A quick check-in can help you lock in the final headcount.",
      action: {
        label: "Review guests",
        onClick: () => onNavigate("guests"),
      },
    };
  } else if (budget !== null && budget.estimated === 0) {
    nextStep = {
      icon: Wallet,
      title: "Set a budget to track spend",
      description:
        "Add estimates and actual costs to keep the event on track.",
      action: {
        label: "Open budget",
        onClick: () => onNavigate("budget"),
      },
    };
  } else {
    nextStep = {
      icon: CheckCircle2,
      title: "Everything is on track",
      description:
        "No urgent items. Take a breath or review the plan when you are ready.",
    };
  }

  const metrics: Array<{
    label: string;
    value: ReactNode;
    unit: string;
    detail: ReactNode;
    icon: ElementType;
    onClick: () => void;
  }> = [
    {
      label: "Guests",
      value: stats.total,
      unit: "total",
      detail: `${stats.confirmed} confirmed · ${stats.pending} pending`,
      icon: Users,
      onClick: () => onNavigate("guests"),
    },
    {
      label: "Budget",
      value:
        budget === null ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          formatCurrency(budget.actual, currency)
        ),
      unit: "spent",
      detail:
        budget === null ? (
          <Skeleton className="h-3 w-40" />
        ) : budget.estimated === 0 ? (
          "No budget set yet"
        ) : (
          `${budgetPercent}% of ${formatCurrency(budget.estimated, currency)} planned`
        ),
      icon: Wallet,
      onClick: () => onNavigate("budget"),
    },
    {
      label: "RSVPs",
      value: `${confirmedPercent}%`,
      unit: "confirmed",
      detail: `${stats.confirmed} of ${stats.total} guests`,
      icon: Send,
      onClick: () => onNavigate("guests"),
    },
  ];

  const NextStepIcon = nextStep.icon;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-5xl px-6 pb-32 pt-8 sm:px-8 lg:px-12 lg:pt-12">
        <header className="animate-soft-rise max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500/80">
            Overview
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
            A calm view of your event.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500 sm:text-[15px]">
            Focus on what needs attention, then move into the details when you
            are ready.
          </p>
        </header>

        <section className="animate-soft-rise mt-10 rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-white/90 via-indigo-50/45 to-violet-50/60 p-6 shadow-sm shadow-indigo-950/[0.04] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <NextStepIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-500/80">
                  Next step
                </p>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-zinc-950">
                  {nextStep.title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                  {nextStep.description}
                </p>
              </div>
            </div>

            {nextStep.action && (
              <button
                onClick={nextStep.action.onClick}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-lg shadow-zinc-950/15 transition-all hover:-translate-y-0.5 hover:bg-zinc-800 sm:self-center"
              >
                {nextStep.action.label}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        <section className="animate-soft-rise mt-8 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/70 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-sm [animation-delay:80ms]">
          <div className="grid sm:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <button
                  key={metric.label}
                  onClick={metric.onClick}
                  className="group relative flex flex-col items-start border-b border-zinc-100 p-6 text-left transition-colors last:border-b-0 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/40 sm:border-b-0 sm:border-r sm:p-8 sm:last:border-r-0"
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      <Icon className="h-3.5 w-3.5" />
                      {metric.label}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 transition-colors group-hover:text-indigo-500" />
                  </span>

                  <div className="mt-6 flex min-h-9 items-end gap-2">
                    <div className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-zinc-950 sm:text-4xl">
                      {metric.value}
                    </div>
                    <span className="pb-1 text-xs text-zinc-400">
                      {metric.unit}
                    </span>
                  </div>

                  <div className="mt-3 min-h-5 text-xs leading-5 text-zinc-500">
                    {metric.detail}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {stats.total > 0 && tables.length > 0 && (
          <section className="animate-soft-rise mt-8 rounded-3xl border border-zinc-200/70 bg-white/60 p-6 shadow-sm shadow-zinc-950/[0.02] backdrop-blur-sm [animation-delay:120ms] sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 max-w-2xl flex-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Seating progress
                </div>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">
                    {stats.seated} of {stats.total}
                  </h2>
                  <p className="text-sm text-zinc-500">guests seated</p>
                </div>

                <div className="mt-5 h-1.5 max-w-xl overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${seatedPercent}%` }}
                  />
                </div>

                <p className="mt-3 text-xs text-zinc-400">
                  {countLabel(tables.length, "table")} · {totalSeats} seats ·{" "}
                  {unseated > 0
                    ? `${countLabel(unseated, "guest")} waiting`
                    : "Everyone has a seat"}
                </p>
              </div>

              {unseated === 0 && (
                <button
                  onClick={() => onNavigate("seating")}
                  className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm shadow-zinc-950/5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 lg:self-center"
                >
                  Review seating
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
