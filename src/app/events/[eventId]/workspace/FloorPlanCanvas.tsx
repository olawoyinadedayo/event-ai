"use client";

import { useCallback, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { TableNode } from "./TableNode";
import { getTableDimensions } from "@/lib/seat-geometry";
import { LayoutGrid, Maximize, Plus, ZoomIn, ZoomOut } from "lucide-react";
import type { Guest, Table } from "@/types/app";

interface FloorPlanCanvasProps {
  tables: Table[];
  guests: Guest[];
  onAddTable?: () => void;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.8;
const WORLD_SIZE = 2400;

export function FloorPlanCanvas({
  tables,
  guests,
  onAddTable,
}: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragState = useRef<{
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
  } | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) =>
        Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor)),
      );
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only pan when clicking on empty canvas background
      if ((e.target as HTMLElement).closest("[data-table], [data-seat]")) return;
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPan: pan,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return;
    setPan({
      x: dragState.current.startPan.x + (e.clientX - dragState.current.startX),
      y: dragState.current.startPan.y + (e.clientY - dragState.current.startY),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const hasTables = tables.length > 0;
  const seatedCount = guests.filter((guest) => guest.table_id).length;
  const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0);

  const { setNodeRef: setWorldRef, isOver: worldIsOver } = useDroppable({
    id: "world-canvas",
  });

  return (
    <div className="relative min-w-0 flex-1 overflow-hidden bg-gradient-to-br from-zinc-50 via-[#f8f8fc] to-indigo-50/30">
      {/* Canvas status */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white/80 px-2.5 py-1.5 text-[11px] text-zinc-500 shadow-sm shadow-zinc-950/5 backdrop-blur-md">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-indigo-50 text-indigo-600">
          <LayoutGrid className="h-3 w-3" />
        </span>
        <span className="font-medium text-zinc-700">Floor plan</span>
        <span className="h-3 w-px bg-zinc-200" />
        <span>
          {tables.length} table{tables.length === 1 ? "" : "s"}
        </span>
        <span className="h-3 w-px bg-zinc-200" />
        <span>
          {seatedCount}/{totalSeats || guests.length || 0} seats filled
        </span>
      </div>

      {/* Zoom controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/85 p-1.5 shadow-lg shadow-zinc-950/5 backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z * 0.9))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={resetView}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          aria-label="Reset view"
        >
          <Maximize className="h-3.5 w-3.5" />
        </button>
        <span className="px-1 py-0.5 text-[9px] font-semibold tabular-nums text-zinc-400">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute left-4 top-[3.75rem] z-10 hidden rounded-xl border border-zinc-200/70 bg-white/75 px-3 py-1.5 text-[10px] text-zinc-400 shadow-sm backdrop-blur-md lg:block">
        Drag guests onto seats · Drag tables to reposition · Scroll to pan ·
        Ctrl+scroll to zoom
      </div>

      <div
        ref={containerRef}
        className="absolute inset-0 overflow-auto"
        onWheel={handleWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="h-full w-full"
          style={{
            width: WORLD_SIZE,
            height: WORLD_SIZE,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <div
            ref={setWorldRef}
            className={`canvas-grid relative h-full w-full transition-opacity ${
              worldIsOver ? "opacity-75" : ""
            }`}
          >
            {/* Center marker */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-40 -translate-x-1/2 -translate-y-1/2 bg-indigo-200/60" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-px -translate-x-1/2 -translate-y-1/2 bg-indigo-200/60" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-200/80 bg-white/60" />

            {!hasTables && (
              <div className="absolute left-1/2 top-1/2 w-64 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-dashed border-indigo-200/80 bg-white/70 p-6 text-center shadow-xl shadow-indigo-950/5 backdrop-blur-md">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
                  <LayoutGrid className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-zinc-800">
                  Start your floor plan
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Add a table, then drag guests from the left onto their seats.
                </p>
                {onAddTable && (
                  <button
                    onClick={onAddTable}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add table
                  </button>
                )}
              </div>
            )}

            {tables.map((table) => {
              const tableGuests = guests.filter((g) => g.table_id === table.id);
              const dims = getTableDimensions(table.shape);
              return (
                <div
                  key={table.id}
                  className="absolute"
                  style={{
                    left: table.pos_x,
                    top: table.pos_y,
                    width: dims.width + 160,
                    height: dims.height + 120,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <TableNode table={table} guests={tableGuests} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
