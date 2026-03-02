import { z } from 'zod';

export const AvailabilitySchema = z.object({
  type: z.literal('availability'),
  payload: z.object({
    date: z.string(), // ISO date (YYYY-MM-DD) ou ISO datetime
    tenantId: z.string().optional(),
    calendarId: z.string().optional(),
  }),
});

export const BookSchema = z.object({
  type: z.literal('book'),
  payload: z.object({
    serviceKey: z.string(),
    start: z.string(), // ISO datetime
    patient: z.object({ name: z.string(), email: z.string().email().optional() }),
    tenantId: z.string().optional(),
    calendarId: z.string().optional(),
  }),
});

export const WebhookSchema = z.union([AvailabilitySchema, BookSchema]);

export type AvailabilityInput = z.infer<typeof AvailabilitySchema>;
export type BookInput = z.infer<typeof BookSchema>;
export type WebhookInput = z.infer<typeof WebhookSchema>;

