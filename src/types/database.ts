export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "pro_planner" | "diy_host";
export type RsvpStatus = "pending" | "confirmed" | "declined";
export type TableShape = "round" | "rectangle";
export type ExpenseCategory = "Venue" | "Catering" | "Entertainment" | "Decor" | "Photography" | "Transport" | "Other";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: UserRole;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          event_type: string | null;
          date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          event_type?: string | null;
          date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          event_type?: string | null;
          date?: string | null;
          created_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          shape: TableShape;
          capacity: number;
          pos_x: number;
          pos_y: number;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          shape?: TableShape;
          capacity?: number;
          pos_x?: number;
          pos_y?: number;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          shape?: TableShape;
          capacity?: number;
          pos_x?: number;
          pos_y?: number;
        };
      };
      guests: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          email: string | null;
          rsvp_status: RsvpStatus;
          dietary_notes: string | null;
          tags: string[];
          table_id: string | null;
          seat_number: number | null;
          invite_sent: boolean;
          invite_sent_at: string | null;
          invite_token: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          email?: string | null;
          rsvp_status?: RsvpStatus;
          dietary_notes?: string | null;
          tags?: string[];
          table_id?: string | null;
          seat_number?: number | null;
          invite_sent?: boolean;
          invite_sent_at?: string | null;
          invite_token?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          email?: string | null;
          rsvp_status?: RsvpStatus;
          dietary_notes?: string | null;
          tags?: string[];
          table_id?: string | null;
          seat_number?: number | null;
          invite_sent?: boolean;
          invite_sent_at?: string | null;
          invite_token?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          event_id: string;
          title: string;
          category: ExpenseCategory;
          estimated_cost: number;
          actual_cost: number;
          paid_status: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          title: string;
          category: ExpenseCategory;
          estimated_cost?: number;
          actual_cost?: number;
          paid_status?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          title?: string;
          category?: ExpenseCategory;
          estimated_cost?: number;
          actual_cost?: number;
          paid_status?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}