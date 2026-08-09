/**
 * Wraps a zod schema into Express middleware. Validates `req.body`,
 * `req.params`, and `req.query` against whichever keys the schema defines,
 * and replaces them with the parsed (and therefore type-coerced/trimmed)
 * values so downstream handlers can trust their shape.
 *
 * @param {import('zod').ZodSchema} schema - Schema with optional `body`,
 *   `params`, `query` sub-shapes, e.g. `z.object({ body: z.object({...}) })`.
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
    }

    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    return next();
  };
}

module.exports = validateRequest;
