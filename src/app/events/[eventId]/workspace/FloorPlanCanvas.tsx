"use client";

import { useCallback, useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { TableNode } from "./TableNode";
import { getTableDimensions } from "@/lib/seat-geometry";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import type { Guest, Table } from "@/types/app";

interface FloorPlanCanvasProps {
  tables: Table[];
  guests: Guest[];
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.8;
const WORLD_SIZE = 2400;

export function FloorPlanCanvas({ tables, guests }: FloorPlanCanvasProps) {
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

  const { setNodeRef: setWorldRef, isOver: worldIsOver } = useDroppable({
    id: "world-canvas",
  });

  return (
    <div className="relative flex-1 overflow-hidden bg-zinc-100">
      {/* Zoom controls */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.1))}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z * 0.9))}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={resetView}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100"
          aria-label="Reset view"
        >
          <Maximize className="h-4 w-4" />
        </button>
        <span className="text-center text-[10px] font-medium text-zinc-500">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-white/80 px-2 py-1 text-[11px] text-zinc-500 backdrop-blur">
        Drag guests onto seats · Drag table bodies to reposition · Scroll to pan · Ctrl+scroll to zoom
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
            className={`relative h-full w-full canvas-grid ${worldIsOver ? "opacity-80" : ""}`}
          >
            {/* Center marker */}
            <div className="absolute left-1/2 top-1/2 h-px w-24 bg-zinc-300" />
            <div className="absolute left-1/2 top-1/2 h-24 w-px bg-zinc-300" />

            {!hasTables && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-sm font-medium text-zinc-500">
                  No tables yet
                </p>
                <p className="text-xs text-zinc-400">
                  Click &quot;+ Add Table&quot; in the toolbar to design your floor plan
                </p>
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
                  <TableNode
                    table={table}
                    guests={tableGuests}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}