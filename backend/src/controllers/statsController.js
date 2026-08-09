/**
 * HTTP layer for application analytics/aggregate stats.
 */

const statsService = require('../services/statsService');
const asyncHandler = require('../utils/asyncHandler');

const get = asyncHandler(async (req, res) => {
  const stats = await statsService.getApplicationStats(req.application.id);
  return res.status(200).json({ stats });
});

module.exports = { get };
