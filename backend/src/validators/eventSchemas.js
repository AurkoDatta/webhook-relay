/**
 * Request validation schemas for event listing/detail routes.
 */

const { z } = require('zod');

const listEventsSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid application id') }),
  query: z.object({
    eventType: z.string().trim().min(1).max(100).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

const eventIdSchema = z.object({ params: z.object({ id: z.string().uuid('Invalid event id') }) });

module.exports = { listEventsSchema, eventIdSchema };
