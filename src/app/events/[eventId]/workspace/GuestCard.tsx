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

const avatarStyles = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
  const avatarStyle =
    avatarStyles[
      guest.name.charCodeAt(0) % avatarStyles.length
    ];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex cursor-grab items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white/90 px-2.5 py-2.5 shadow-sm shadow-zinc-950/[0.02] transition-all duration-200 hover:-translate-y-px hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-950/[0.06] active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      aria-label={`Drag ${guest.name}`}
    >
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ring-2 ring-white",
          avatarStyle,
        )}
      >
        {initials(guest.name)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-medium text-zinc-900">
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
        <div className="mt-0.5 flex min-w-0 items-center gap-1">
          {guest.tags.length > 0 ? (
            <>
              {guest.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="truncate rounded-full bg-indigo-50 px-1.5 py-0.5 text-[9px] font-medium text-indigo-600"
                >
                  {tag}
                </span>
              ))}
              {guest.tags.length > 2 && (
                <span className="shrink-0 text-[9px] text-zinc-400">
                  +{guest.tags.length - 2}
                </span>
              )}
            </>
          ) : (
            <span className="truncate text-[10px] text-zinc-400">
              {guest.email ?? "No email"}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={rsvp.variant} className="px-1.5 py-0 text-[9px]">
          {rsvp.label}
        </Badge>
        <GripVertical className="h-3.5 w-3.5 text-zinc-300 transition-colors group-hover:text-zinc-400" />
      </div>
    </div>
  );
}