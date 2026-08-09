/**
 * Request validation schemas for subscriber endpoint routes.
 */

const { z } = require('zod');

// Either "*" (wildcard, subscribe to everything) or a tenant-defined event
// type string like "user.created". Kept intentionally loose since event
// types are free-form and tenant-owned, not a fixed platform enum.
const eventTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^(\*|[a-zA-Z0-9][a-zA-Z0-9_.-]*)$/, 'Event type may only contain letters, numbers, ".", "_", "-"');

const createEndpointSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid application id') }),
  body: z.object({
    url: z.string().trim().url('Must be a valid URL').max(2048),
    description: z.string().trim().max(500).optional(),
    subscribedEventTypes: z.array(eventTypeSchema).min(1, 'Subscribe to at least one event type or "*"'),
  }),
});

const updateEndpointSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid endpoint id') }),
  body: z.object({
    url: z.string().trim().url('Must be a valid URL').max(2048).optional(),
    description: z.string().trim().max(500).optional(),
    subscribedEventTypes: z.array(eventTypeSchema).min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

const endpointIdSchema = z.object({ params: z.object({ id: z.string().uuid('Invalid endpoint id') }) });

module.exports = { createEndpointSchema, updateEndpointSchema, endpointIdSchema };
