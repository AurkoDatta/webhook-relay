/**
 * Request validation schemas for delivery attempt-history/replay routes.
 */

const { z } = require('zod');

const deliveryIdSchema = z.object({ params: z.object({ id: z.string().uuid('Invalid delivery id') }) });

module.exports = { deliveryIdSchema };
