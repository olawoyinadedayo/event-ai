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
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          isDragging && "opacity-50",
          isOver && "ring-4 ring-indigo-400 ring-offset-2",
          full && "cursor-not-allowed",
        )}
        title={full ? "Table is full" : "Drag to move · Drop guest here"}
      >
        <div
          className={cn(
            "relative flex items-center justify-center",
            isRound
              ? "rounded-full bg-gradient-to-br from-zinc-50 to-zinc-200 shadow-inner"
              : "rounded-lg bg-gradient-to-br from-zinc-50 to-zinc-200 shadow-inner",
            isRound ? "h-[140px] w-[140px]" : "h-[100px] w-[160px]",
          )}
        >
          {/* Table surface */}
          <div
            className={cn(
              "flex flex-col items-center justify-center border-2 border-zinc-300 bg-white/80",
              isRound
                ? "h-[110px] w-[110px] rounded-full"
                : "h-[72px] w-[130px] rounded-md",
            )}
          >
            <span className="flex items-center gap-1 px-2 text-center text-xs font-semibold text-zinc-800">
              <GripVertical className="h-3 w-3 text-zinc-400" />
              {table.name}
            </span>
            <span className="mt-0.5 text-[10px] text-zinc-500">
              {guests.length}/{table.capacity} seated
            </span>
            <span className="text-[10px] text-zinc-400">
              {isRound ? "Round" : "Rectangular"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}