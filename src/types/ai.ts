import { z } from "zod";

export const ParsedGuestSchema = z
  .object({
    name: z.string().trim().min(1).catch("Unknown Guest"),
    email: z.string().trim().nullish().catch(null),
    rsvp_status: z
      .enum(["pending", "confirmed", "declined"])
      .catch("pending"),
    dietary_notes: z.string().trim().nullish().catch(null),
    tags: z.array(z.string().trim()).catch([]),
  })
  .passthrough();

export type ParsedGuest = z.infer<typeof ParsedGuestSchema>;

export const ParseResultSchema = z.preprocess(
  (val) => (Array.isArray(val) ? { guests: val } : val),
  z.object({
    guests: z.array(ParsedGuestSchema).catch([]),
  }),
);

export const SeatingAssignmentSchema = z.object({
  guest_id: z.string().uuid(),
  table_id: z.string().uuid(),
  seat_number: z.number().int().min(0),
});

export const SeatingPlanSchema = z.object({
  assignments: z.array(SeatingAssignmentSchema),
  reasoning: z.string(),
});

export type SeatingPlan = z.infer<typeof SeatingPlanSchema>;

export const TimelineItemSchema = z.object({
  time: z.string(),
  activity: z.string(),
  notes: z.string().optional(),
});

export const TimelineSchema = z.object({
  title: z.string(),
  items: z.array(TimelineItemSchema),
});

export type Timeline = z.infer<typeof TimelineSchema>;