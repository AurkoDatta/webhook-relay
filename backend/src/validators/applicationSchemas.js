/**
 * Request validation schemas for application (tenant namespace) routes.
 */

const { z } = require('zod');

const applicationIdParams = z.object({ id: z.string().uuid('Invalid application id') });

const createApplicationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(200),
  }),
});

const applicationIdSchema = z.object({ params: applicationIdParams });

module.exports = { createApplicationSchema, applicationIdSchema };
