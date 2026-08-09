/**
 * HTTP layer for application (tenant namespace) management.
 */

const applicationService = require('../services/applicationService');
const asyncHandler = require('../utils/asyncHandler');

const create = asyncHandler(async (req, res) => {
  const result = await applicationService.createApplication(req.user.id, req.body);
  return res.status(201).json(result);
});

const list = asyncHandler(async (req, res) => {
  const applications = await applicationService.listApplications(req.user.id);
  return res.status(200).json({ applications });
});

const get = asyncHandler(async (req, res) => {
  const application = applicationService.getApplication(req.application);
  return res.status(200).json({ application });
});

const rotateSecret = asyncHandler(async (req, res) => {
  const result = await applicationService.rotateSigningSecret(req.application);
  return res.status(200).json(result);
});

const rotateApiKey = asyncHandler(async (req, res) => {
  const result = await applicationService.rotateApiKey(req.application);
  return res.status(200).json(result);
});

module.exports = { create, list, get, rotateSecret, rotateApiKey };
