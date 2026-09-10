import type { Database } from "./database";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Table = Database["public"]["Tables"]["tables"]["Row"];
export type Guest = Database["public"]["Tables"]["guests"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export type NewGuest = Omit<
  Database["public"]["Tables"]["guests"]["Insert"],
  "id" | "event_id"
>;

export type NewExpense = Omit<
  Database["public"]["Tables"]["expenses"]["Insert"],
  "id" | "event_id"
>;

export type EventWithStats = Event & {
  guestCount: number;
  confirmedCount: number;
  seatedCount: number;
  tableCount: number;
};

export interface GuestFilters {
  search: string;
  tags: string[];
  rsvp: "all" | "pending" | "confirmed" | "declined";
}

export interface SeatedGuest extends Guest {
  tableName?: string;
}

export interface TableWithGuests extends Table {
  guests: Guest[];
  availableSeats: number;
}

export interface SeatPosition {
  x: number;
  y: number;
  index: number;
}