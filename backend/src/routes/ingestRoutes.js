/**
 * /api/ingest — the tenant-facing event ingestion endpoint. Authenticated
 * with a per-application API key, not a dashboard JWT session, and kept on
 * its own router so it can have a tighter JSON body-size limit and its own
 * rate limiter.
 */

const { Router } = require('express');
const express = require('express');
const ingestController = require('../controllers/ingestController');
const apiKeyAuthMiddleware = require('../middleware/apiKeyAuthMiddleware');
const { ingestRateLimiter } = require('../middleware/rateLimitMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { ingestEventSchema } = require('../validators/ingestSchemas');

const router = Router();

router.post(
  '/',
  express.json({ limit: '256kb' }),
  apiKeyAuthMiddleware,
  ingestRateLimiter,
  validateRequest(ingestEventSchema),
  ingestController.ingest
);

module.exports = router;
