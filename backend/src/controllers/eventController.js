/**
 * HTTP layer for event listing and detail.
 */

const eventService = require('../services/eventService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const result = await eventService.listEvents(req.application.id, req.query);
  return res.status(200).json(result);
});

const detail = asyncHandler(async (req, res) => {
  const event = await eventService.getEventDetail(req.event);
  return res.status(200).json({ event });
});

module.exports = { list, detail };
