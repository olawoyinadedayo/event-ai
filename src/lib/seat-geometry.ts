import type { SeatPosition, Table } from "@/types/app";

export const TABLE_RADIUS = 70;
export const TABLE_WIDTH = 160;
export const TABLE_HEIGHT = 100;
export const SEAT_RADIUS = 13;
export const SEAT_GAP = 26;

export function getRoundSeatPositions(capacity: number): SeatPosition[] {
  const seatRadius = 18;
  const ringRadius = TABLE_RADIUS + 6 + seatRadius;

  return Array.from({ length: capacity }, (_, i) => {
    const angle = (i / capacity) * Math.PI * 2 - Math.PI / 2;
    return {
      x: ringRadius * Math.cos(angle),
      y: ringRadius * Math.sin(angle),
      index: i,
    };
  });
}

export function getRectSeatPositions(capacity: number): SeatPosition[] {
  const positions: SeatPosition[] = [];
  const hw = TABLE_WIDTH / 2;
  const hh = TABLE_HEIGHT / 2;
  const seatRadius = 18;

  // Seats along top and bottom edges
  const perSide = Math.max(1, Math.floor(capacity / 2));
  const remaining = capacity - perSide * 2;

  for (let i = 0; i < perSide; i++) {
    const t = (i + 0.5) / perSide;
    positions.push({
      x: -hw + t * TABLE_WIDTH,
      y: -(hh + 6 + seatRadius),
      index: positions.length,
    });
    positions.push({
      x: -hw + t * TABLE_WIDTH,
      y: hh + 6 + seatRadius,
      index: positions.length,
    });
  }

  // Left/right edges for odd remainder
  if (remaining > 0) {
    for (let i = 0; i < remaining; i++) {
      const t = (i + 0.5) / remaining;
      positions.push({
        x: -(hw + 6 + seatRadius),
        y: -hh + t * TABLE_HEIGHT,
        index: positions.length,
      });
    }
  }

  return positions;
}

export function getSeatPositions(table: Pick<Table, "shape" | "capacity">): SeatPosition[] {
  return table.shape === "round"
    ? getRoundSeatPositions(table.capacity)
    : getRectSeatPositions(table.capacity);
}

export function getTableDimensions(shape: Table["shape"]) {
  if (shape === "round") {
    return { width: TABLE_RADIUS * 2, height: TABLE_RADIUS * 2 };
  }
  return { width: TABLE_WIDTH, height: TABLE_HEIGHT };
}