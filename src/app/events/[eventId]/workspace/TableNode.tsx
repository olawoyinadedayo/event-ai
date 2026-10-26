"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SeatNode } from "./SeatNode";
import { getSeatPositions } from "@/lib/seat-geometry";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest, Table } from "@/types/app";

interface TableNodeProps {
  table: Table;
  guests: Guest[];
}

export function TableNode({ table, guests }: TableNodeProps) {
  const seatPositions = getSeatPositions(table);

  // Table body is draggable (to reposition) AND droppable (to seat a guest)
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `table-move-${table.id}`,
    data: { type: "table", tableId: table.id },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `table-${table.id}`,
    data: { type: "table-drop", tableId: table.id },
  });

  const setRefs = (el: HTMLDivElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const isRound = table.shape === "round";
  const full = guests.length >= table.capacity;
  const occupancy = table.capacity
    ? Math.min(100, (guests.length / table.capacity) * 100)
    : 0;

  return (
    <div className="relative h-full w-full" data-table>
      {/* Seat nodes */}
      {seatPositions.map((seat) => {
        const occupant = guests.find((g) => g.seat_number === seat.index);
        return (
          <div
            key={seat.index}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${seat.x}px), calc(-50% + ${seat.y}px))`,
            }}
          >
            <SeatNode
              tableId={table.id}
              seatNumber={seat.index}
              occupant={occupant}
            />
          </div>
        );
      })}

      {/* Table body — drag handle + drop target */}
      <div
        ref={setRefs}
        {...attributes}
        {...listeners}
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing",
          isDragging && "opacity-50",
          isOver && "ring-4 ring-indigo-300/60 ring-offset-4 ring-offset-[#f8f8fc]",
          full && "cursor-not-allowed",
        )}
        title={full ? "Table is full" : "Drag to move · Drop guest here"}
      >
        <div
          className={cn(
            "relative flex items-center justify-center border border-zinc-200/80 bg-gradient-to-br from-white via-white to-zinc-100/80 shadow-lg shadow-zinc-950/[0.07]",
            isRound ? "h-[144px] w-[144px] rounded-full" : "h-[108px] w-[172px] rounded-2xl",
          )}
        >
          <div
            className={cn(
              "relative flex flex-col items-center justify-center overflow-hidden border border-zinc-200/80 bg-white/90 shadow-inner shadow-zinc-950/[0.03]",
              isRound
                ? "h-[116px] w-[116px] rounded-full"
                : "h-[80px] w-[142px] rounded-xl",
            )}
          >
            <span className="flex items-center gap-1 px-2 text-center text-[11px] font-semibold tracking-tight text-zinc-800">
              <GripVertical className="h-3 w-3 text-indigo-300" />
              <span className="max-w-[92px] truncate">{table.name}</span>
            </span>
            <span className="mt-0.5 text-[9px] font-medium text-zinc-400">
              {guests.length}/{table.capacity} seated
            </span>
            <span className="text-[9px] capitalize text-zinc-300">
              {table.shape}
            </span>

            <div className="absolute inset-x-4 bottom-2 h-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  full ? "bg-amber-400" : "bg-indigo-500",
                )}
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
