"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Circle,
  ChevronDown,
  DollarSign,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES, formatCurrency, getCurrency } from "@/lib/currency";
import type { Expense } from "@/types/app";
import type { CurrencyCode, ExpenseCategory } from "@/types/database";

interface BudgetTabProps {
  eventId: string;
  currency: CurrencyCode;
  onCurrencyChange: (
    currency: CurrencyCode,
  ) => Promise<{ error: string | null }>;
}

const CATEGORIES: ExpenseCategory[] = [
  "Venue",
  "Catering",
  "Entertainment",
  "Decor",
  "Photography",
  "Transport",
  "Other",
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Venue: "bg-violet-50 text-violet-700 ring-violet-600/10",
  Catering: "bg-amber-50 text-amber-700 ring-amber-600/10",
  Entertainment: "bg-pink-50 text-pink-700 ring-pink-600/10",
  Decor: "bg-teal-50 text-teal-700 ring-teal-600/10",
  Photography: "bg-indigo-50 text-indigo-700 ring-indigo-600/10",
  Transport: "bg-orange-50 text-orange-700 ring-orange-600/10",
  Other: "bg-zinc-100 text-zinc-600 ring-zinc-500/10",
};

const summaryTones = {
  indigo: {
    icon: "bg-indigo-50 text-indigo-600",
    value: "text-zinc-950",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    value: "text-zinc-950",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    value: "text-emerald-600",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    value: "text-zinc-950",
  },
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  tone: keyof typeof summaryTones;
}) {
  const styles = summaryTones[tone];

  return (
    <div className="bento-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            {label}
          </div>
          <div
            className={cn(
              "mt-3 text-[1.65rem] font-semibold tracking-[-0.04em]",
              styles.value,
            )}
          >
            {value}
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">{detail}</p>
        </div>
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function BudgetSkeleton() {
  return (
    <div
      className="scrollbar-thin h-full overflow-y-auto"
      role="status"
      aria-busy="true"
      aria-label="Loading budget"
    >
      <span className="sr-only">Loading budget…</span>
      <div className="mx-auto w-full max-w-6xl px-5 pb-32 pt-7 sm:px-7 lg:px-10 lg:pt-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="mt-3 h-10 w-36" />
            <Skeleton className="mt-3 h-3.5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-32 shrink-0 rounded-xl" />
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bento-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="h-2.5 w-24" />
                  <Skeleton className="mt-3.5 h-7 w-28" />
                  <Skeleton className="mt-2 h-2.5 w-32 max-w-full" />
                </div>
                <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2 h-2.5 w-48" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-2 w-full rounded-full" />
        </div>

        <div className="mt-8">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-2 h-3 w-40" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-2/5" />
                    <Skeleton className="h-2.5 w-3/5" />
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BudgetTab({
  eventId,
  currency,
  onCurrencyChange,
}: BudgetTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "Venue" as ExpenseCategory,
    estimated_cost: 0,
    actual_cost: 0,
    paid_status: false,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/expenses`);
      const { data, error } = await res.json();
      if (!error && data) setExpenses(data);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const mounted = { current: true };

    const loadAndSubscribe = async () => {
      setTimeout(() => loadExpenses(), 0);

      const channel = supabase
        .channel(`expenses-${eventId}`, {
          config: {
            broadcast: { ack: false },
            presence: { key: "" },
          },
        })
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `event_id=eq.${eventId}`,
          },
          () => {
            if (mounted.current) loadExpenses();
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("Realtime subscription error:", status);
          }
        });

      return channel;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any = null;
    loadAndSubscribe().then((c) => {
      channel = c;
    });

    return () => {
      mounted.current = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId, supabase, loadExpenses]);

  const resetForm = () => {
    setFormData({
      title: "",
      category: "Venue",
      estimated_cost: 0,
      actual_cost: 0,
      paid_status: false,
      notes: "",
    });
  };

  const openDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        title: expense.title,
        category: expense.category,
        estimated_cost: Number(expense.estimated_cost),
        actual_cost: Number(expense.actual_cost),
        paid_status: expense.paid_status,
        notes: expense.notes ?? "",
      });
    } else {
      setEditingExpense(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    resetForm();
  };

  const handleCurrencyChange = async (nextCurrency: CurrencyCode) => {
    if (nextCurrency === currency || savingCurrency) return;

    setSavingCurrency(true);
    setCurrencyError(null);

    try {
      const result = await onCurrencyChange(nextCurrency);
      if (result.error) setCurrencyError(result.error);
    } catch {
      setCurrencyError("Could not update currency. Please try again.");
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingExpense
        ? `/api/events/${eventId}/expenses/${editingExpense.id}`
        : `/api/events/${eventId}/expenses`;
      const method = editingExpense ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const { error } = await res.json();
      if (!error) {
        closeDialog();
        loadExpenses();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      const res = await fetch(`/api/events/${eventId}/expenses/${id}`, {
        method: "DELETE",
      });
      const { error } = await res.json();
      if (!error) loadExpenses();
    } catch {}
  };

  const handlePaidToggle = async (expense: Expense) => {
    try {
      const res = await fetch(`/api/events/${eventId}/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid_status: !expense.paid_status }),
      });
      const { error } = await res.json();
      if (!error) loadExpenses();
    } catch {}
  };

  // Calculations
  const totalBudget = expenses.reduce((sum, e) => sum + Number(e.estimated_cost), 0);
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.actual_cost), 0);
  const remaining = totalBudget - totalSpent;
  const paidCount = expenses.filter((e) => e.paid_status).length;
  const pendingCount = expenses.length - paidCount;
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (loading && expenses.length === 0) {
    return <BudgetSkeleton />;
  }

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-5 pb-32 pt-7 sm:px-7 lg:px-10 lg:pt-9">
        <div className="animate-soft-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-indigo-600 shadow-sm shadow-indigo-950/5">
              <DollarSign className="h-3 w-3" />
              Event budget
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
              Budget
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-500">
              Track estimates, actual spend, and what still needs to be paid.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <label
                className="relative inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white/80 pl-3.5 pr-9 shadow-sm shadow-zinc-950/[0.02] transition-colors focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10"
                title={getCurrency(currency).label}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none flex items-center gap-1.5"
                >
                  <span className="text-sm font-semibold text-zinc-400">
                    {getCurrency(currency).symbol}
                  </span>
                  <span className="text-sm font-semibold text-zinc-800">
                    {currency}
                  </span>
                </span>
                <select
                  value={currency}
                  onChange={(event) => {
                    void handleCurrencyChange(
                      event.target.value as CurrencyCode,
                    );
                  }}
                  disabled={savingCurrency}
                  aria-label="Event currency"
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 focus:outline-none disabled:cursor-wait"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} ({option.symbol})
                    </option>
                  ))}
                </select>
                {savingCurrency ? (
                  <Loader2 className="pointer-events-none absolute right-3 h-3.5 w-3.5 animate-spin text-zinc-400" />
                ) : (
                  <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-zinc-400" />
                )}
              </label>

              {expenses.length > 0 && (
                <button
                  onClick={() => openDialog()}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  Add expense
                </button>
              )}
            </div>
            {currencyError && (
              <p
                role="status"
                aria-live="polite"
                className="text-right text-[11px] text-red-600"
              >
                {currencyError}
              </p>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={DollarSign}
            label="Total budget"
            value={formatCurrency(totalBudget, currency)}
            detail={`${expenses.length} expense${expenses.length === 1 ? "" : "s"} planned`}
            tone="indigo"
          />
          <SummaryCard
            icon={CheckCircle}
            label="Total spent"
            value={formatCurrency(totalSpent, currency)}
            detail="Actual costs recorded"
            tone="amber"
          />
          <SummaryCard
            icon={Circle}
            label="Remaining"
            value={formatCurrency(remaining, currency)}
            detail={remaining < 0 ? "Over the planned budget" : "Available to spend"}
            tone="emerald"
          />
          <SummaryCard
            icon={CheckCircle}
            label="Paid / pending"
            value={`${paidCount} / ${pendingCount}`}
            detail={`${expenses.length} total items`}
            tone="violet"
          />
        </div>

        {/* Progress */}
        <div className="animate-soft-rise mt-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm shadow-zinc-950/[0.03] backdrop-blur-sm [animation-delay:80ms]">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-xs font-medium text-zinc-700">
                Budget utilization
              </span>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                {formatCurrency(totalSpent, currency)} of{" "}
                {formatCurrency(totalBudget, currency)} spent
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                utilization > 100
                  ? "bg-red-50 text-red-600"
                  : utilization > 80
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700",
              )}
            >
              {utilization.toFixed(1)}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                utilization > 100
                  ? "bg-red-500"
                  : utilization > 80
                    ? "bg-amber-400"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500",
              )}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>

        {/* Expense List */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Expenses
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {expenses.length} item{expenses.length === 1 ? "" : "s"} in this budget
              </p>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/60 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-50 text-zinc-300">
                <DollarSign className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-zinc-700">
                No expenses yet
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Add your first line item to start tracking the budget.
              </p>
              <button
                onClick={() => openDialog()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Add first expense
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-zinc-200/70 bg-white/85 p-4 shadow-sm shadow-zinc-950/[0.02] backdrop-blur-sm transition-all hover:border-indigo-100 hover:bg-white hover:shadow-md hover:shadow-indigo-950/[0.04] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset",
                        CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other,
                      )}
                    >
                      {expense.category}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {expense.title}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
                        <span>
                          Est.{" "}
                          {formatCurrency(Number(expense.estimated_cost), currency)}
                        </span>
                        <span>
                          Actual{" "}
                          {formatCurrency(Number(expense.actual_cost), currency)}
                        </span>
                        {expense.notes && (
                          <span className="max-w-[240px] truncate">{expense.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
                    <label className="mr-1 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-500 ring-1 ring-inset ring-zinc-500/10">
                      <input
                        type="checkbox"
                        checked={expense.paid_status}
                        onChange={() => handlePaidToggle(expense)}
                        className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                        aria-label={expense.paid_status ? "Mark as unpaid" : "Mark as paid"}
                      />
                      {expense.paid_status ? "Paid" : "Mark paid"}
                    </label>
                    <button
                      onClick={() => openDialog(expense)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                      aria-label="Edit expense"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm">
          <div className="animate-soft-rise w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/25">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <DollarSign className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-zinc-950">
                    {editingExpense ? "Edit expense" : "Add expense"}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    Track planned and actual costs in {currency}.
                  </p>
                </div>
              </div>
              <button
                onClick={closeDialog}
                className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Venue Rental, Catering Service, DJ/Entertainment..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="estimated-cost"
                    className="mb-1.5 block text-[13px] font-medium text-zinc-700"
                  >
                    Estimated cost ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400">
                      {getCurrency(currency).symbol}
                    </span>
                    <input
                      id="estimated-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) || 0 })}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3.5 text-sm text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="5,000.00"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">Planned budget for this item</p>
                </div>
                <div>
                  <label
                    htmlFor="actual-cost"
                    className="mb-1.5 block text-[13px] font-medium text-zinc-700"
                  >
                    Actual cost ({currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-400">
                      {getCurrency(currency).symbol}
                    </span>
                    <input
                      id="actual-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={formData.actual_cost}
                      onChange={(e) => setFormData({ ...formData, actual_cost: Number(e.target.value) || 0 })}
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3.5 text-sm text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="4,850.00"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">Final amount paid or invoiced</p>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="paid"
                    checked={formData.paid_status}
                    onChange={(e) => setFormData({ ...formData, paid_status: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <label htmlFor="paid" className="cursor-pointer text-sm font-medium text-zinc-700">
                    Mark as paid
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-zinc-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm shadow-zinc-950/[0.02] transition-all placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Optional: deposit details, vendor info, payment terms..."
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="h-9 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm shadow-zinc-950/5 transition-colors hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.title}
                  className="h-9 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingExpense ? "Update expense" : "Add expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}