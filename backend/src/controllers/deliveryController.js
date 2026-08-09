/**
 * HTTP layer for delivery attempt history and manual replay.
 */

const deliveryService = require('../services/deliveryService');
const asyncHandler = require('../utils/asyncHandler');

const attempts = asyncHandler(async (req, res) => {
  const attempts = await deliveryService.getAttemptHistory(req.delivery.id);
  return res.status(200).json({ attempts });
});

const replay = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.replayDelivery(req.delivery);
  return res.status(201).json({ delivery });
});

module.exports = { attempts, replay };
