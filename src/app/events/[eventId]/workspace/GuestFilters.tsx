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
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "Declined" },
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
    <div className="space-y-2 border-b border-zinc-200 px-4 py-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search guests…"
          className="pl-8"
        />
      </div>

      {/* RSVP filter */}
      <div className="flex gap-1">
        {rsvpOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onRsvpFilterChange(opt.value)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              rsvpFilter === opt.value
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Tags
          </div>
          <div className="flex flex-wrap gap-1">
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
                    "rounded-full px-2 py-0.5 text-xs transition-colors",
                    selected
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200",
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
          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}
    </div>
  );
}