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
        "flex h-[36px] w-[36px] items-center justify-center rounded-full border-2 transition-all",
        occupant
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-dashed border-zinc-400 bg-white/70 text-zinc-400",
        isOver && "scale-125 border-indigo-500 bg-indigo-100 text-indigo-600",
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
            <span className="absolute -top-1 -right-2">
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