/**
 * HTTP layer for subscriber endpoint management.
 */

const endpointService = require('../services/endpointService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const endpoint = await endpointService.createEndpoint(req.application, req.body);
  return res.status(201).json({ endpoint });
});

const list = asyncHandler(async (req, res) => {
  const endpoints = await endpointService.listEndpoints(req.application.id);
  return res.status(200).json({ endpoints });
});

const update = asyncHandler(async (req, res) => {
  const endpoint = await endpointService.updateEndpoint(req.endpoint, req.body);
  return res.status(200).json({ endpoint });
});

const remove = asyncHandler(async (req, res) => {
  await endpointService.deleteEndpoint(req.endpoint);
  return res.status(204).send();
});

module.exports = { create, list, update, remove };
