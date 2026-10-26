"use client";

import { useDroppable } from "@dnd-kit/core";
import { WheatOff, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest } from "@/types/app";

interface SeatNodeProps {
  tableId: string;
  seatNumber: number;
  occupant?: Guest;
}

export function SeatNode({ tableId, seatNumber, occupant }: SeatNodeProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `seat-${tableId}-${seatNumber}`,
    data: { type: "seat", tableId, seatNumber },
  });

  return (
    <div
      ref={setNodeRef}
      data-seat
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-150",
        occupant
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-950/5"
          : "border-dashed border-zinc-300 bg-white/75 text-zinc-400 hover:border-indigo-300 hover:text-indigo-400",
        isOver &&
          "scale-125 border-indigo-400 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-600/15",
      )}
      title={
        occupant
          ? `Seat ${seatNumber + 1}: ${occupant.name}`
          : `Seat ${seatNumber + 1} — available`
      }
    >
      {occupant ? (
        <div className="relative flex flex-col items-center">
          <span className="text-[10px] font-semibold leading-none">
            {occupant.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          {occupant.dietary_notes && (
            <span className="absolute -right-2 -top-1 rounded-full bg-white">
              <WheatOff className="h-3 w-3 text-amber-500" />
            </span>
          )}
        </div>
      ) : isOver ? (
        <User className="h-3.5 w-3.5" />
      ) : (
        <span className="text-[9px] font-medium">{seatNumber + 1}</span>
      )}
    </div>
  );
}
