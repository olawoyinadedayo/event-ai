"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  tagFilter: string[];
  onTagFilterChange: (v: string[]) => void;
  allTags: string[];
  rsvpFilter: string;
  onRsvpFilterChange: (v: string) => void;
}

const rsvpOptions = [
  { value: "all", label: "All" },
  { value: "confirmed", label: "Going" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "No" },
];

export function GuestFilters({
  search,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  allTags,
  rsvpFilter,
  onRsvpFilterChange,
}: GuestFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search guests…"
          className="h-10 bg-white pl-9 shadow-none"
        />
      </div>

      {/* RSVP filter */}
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-100/80 p-1">
        {rsvpOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onRsvpFilterChange(opt.value)}
            className={cn(
              "rounded-lg px-1.5 py-1.5 text-[11px] font-medium transition-all",
              rsvpFilter === opt.value
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Tags
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const selected = tagFilter.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() =>
                    onTagFilterChange(
                      selected
                        ? tagFilter.filter((t) => t !== tag)
                        : [...tagFilter, tag],
                    )
                  }
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-all",
                    selected
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(search || tagFilter.length > 0 || rsvpFilter !== "all") && (
        <button
          onClick={() => {
            onSearchChange("");
            onTagFilterChange([]);
            onRsvpFilterChange("all");
          }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}
