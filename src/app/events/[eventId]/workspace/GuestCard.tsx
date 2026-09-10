"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { GripVertical, WheatOff } from "lucide-react";
import type { Guest } from "@/types/app";
import { cn } from "@/lib/utils";

const rsvpStyles: Record<Guest["rsvp_status"], { label: string; variant: "success" | "warning" | "danger" }> = {
  confirmed: { label: "Confirmed", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  declined: { label: "Declined", variant: "danger" },
};

export function GuestCard({ guest }: { guest: Guest }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: guest.id, data: { type: "guest", guest } });

  const rsvp = rsvpStyles[guest.rsvp_status];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex cursor-grab items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      aria-label={`Drag ${guest.name}`}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-zinc-300 group-hover:text-zinc-400" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-zinc-900">
            {guest.name}
          </span>
          {guest.dietary_notes && (
            <span
              className="shrink-0"
              title={`Dietary: ${guest.dietary_notes}`}
            >
              <WheatOff className="h-3.5 w-3.5 text-amber-500" />
            </span>
          )}
        </div>
        {guest.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {guest.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600"
              >
                {tag}
              </span>
            ))}
            {guest.tags.length > 3 && (
              <span className="text-[10px] text-zinc-400">
                +{guest.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <Badge variant={rsvp.variant} className="shrink-0">
        {rsvp.label}
      </Badge>
    </div>
  );
}