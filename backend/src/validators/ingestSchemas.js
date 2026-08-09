/**
 * Request validation for the ingestion endpoint.
 */

const { z } = require('zod');

const ingestEventSchema = z.object({
  body: z.object({
    eventType: z
      .string()
      .trim()
      .min(1, 'eventType is required')
      .max(100)
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, 'eventType may only contain letters, numbers, ".", "_", "-"'),
    payload: z.record(z.unknown(), { required_error: 'payload is required' }),
  }),
});

module.exports = { ingestEventSchema };
