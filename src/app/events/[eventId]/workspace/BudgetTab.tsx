"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, CheckCircle, Circle, DollarSign, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/types/app";

interface BudgetTabProps {
  eventId: string;
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
  Venue: "bg-purple-100 text-purple-700",
  Catering: "bg-amber-100 text-amber-700",
  Entertainment: "bg-pink-100 text-pink-700",
  Decor: "bg-teal-100 text-teal-700",
  Photography: "bg-indigo-100 text-indigo-700",
  Transport: "bg-orange-100 text-orange-700",
  Other: "bg-zinc-100 text-zinc-700",
};

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm border border-zinc-100">
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-zinc-900" style={{ color: color }}>
        {value}
      </div>
    </div>
  );
}

export function BudgetTab({ eventId }: BudgetTabProps) {
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Summary Cards - Clean 4-column grid */}
      <div className="border-b border-zinc-200 px-6 py-5 bg-zinc-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={DollarSign} label="Total Budget" value={`$${totalBudget.toLocaleString()}`} />
          <SummaryCard icon={CheckCircle} label="Total Spent" value={`$${totalSpent.toLocaleString()}`} color="#f59e0b" />
          <SummaryCard icon={Circle} label="Remaining" value={`$${remaining.toLocaleString()}`} color="#10b981" />
          <SummaryCard
            icon={CheckCircle}
            label="Paid / Pending"
            value={`${paidCount} / ${pendingCount}`}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-zinc-100 bg-white">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-600">Budget Utilization</span>
          <span className="font-medium text-zinc-900">{utilization.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn(
              "h-full transition-all duration-500",
              utilization > 100 ? "bg-red-500" : utilization > 80 ? "bg-amber-500" : "bg-emerald-500",
            )}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Expense List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900">Expenses</h2>
          <button
            onClick={() => openDialog()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign className="mb-3 h-10 w-10 text-zinc-300" />
            <p className="text-sm text-zinc-500">No expenses yet</p>
            <button
              onClick={() => openDialog()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm border border-zinc-100 hover:border-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                      CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other,
                    )}
                  >
                    {expense.category}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{expense.title}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                      <span>Est: ${Number(expense.estimated_cost).toLocaleString()}</span>
                      <span>Actual: ${Number(expense.actual_cost).toLocaleString()}</span>
                      {expense.notes && <span className="truncate max-w-[200px]">{expense.notes}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={expense.paid_status}
                    onChange={() => handlePaidToggle(expense)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    aria-label={expense.paid_status ? "Mark as unpaid" : "Mark as paid"}
                  />
                  <button
                    onClick={() => openDialog(expense)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                    aria-label="Edit expense"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add/Edit Expense Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl overflow-hidden animate-in">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </h3>
              <button
                onClick={closeDialog}
                className="rounded-lg p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    placeholder="Venue Rental, Catering Service, DJ/Entertainment..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors bg-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Estimated Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimated_cost}
                      onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-zinc-300 pl-8 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      placeholder="5,000.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Planned budget for this item</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Actual Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.actual_cost}
                      onChange={(e) => setFormData({ ...formData, actual_cost: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-zinc-300 pl-8 pr-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      placeholder="4,850.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">Final amount paid or invoiced</p>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="paid"
                    checked={formData.paid_status}
                    onChange={(e) => setFormData({ ...formData, paid_status: e.target.checked })}
                    className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                  <label htmlFor="paid" className="text-sm text-zinc-700 cursor-pointer font-medium">
                    Mark as Paid
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                  placeholder="Optional: deposit details, vendor info, payment terms, dietary requirements..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.title}
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Saving..." : editingExpense ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}