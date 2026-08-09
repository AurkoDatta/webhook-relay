/**
 * HTTP layer for event ingestion.
 */

const ingestionService = require('../services/ingestionService');
const asyncHandler = require('../utils/asyncHandler');

const ingest = asyncHandler(async (req, res) => {
  const { eventType, payload } = req.body;
  const result = await ingestionService.ingestEvent({
    applicationId: req.application.id,
    planTier: req.application.planTier,
    eventType,
    payload,
  });
  return res.status(202).json(result);
});

module.exports = { ingest };
