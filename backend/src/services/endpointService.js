/**
 * Subscriber endpoint business logic: CRUD scoped to an application, with
 * the plan-tier max-endpoints-per-application limit enforced on creation.
 */

const prisma = require('../db/prismaClient');
const { getPlanLimits } = require('../config/planLimits');
const ApiError = require('../utils/ApiError');

function toPublicEndpoint(endpoint) {
  return {
    id: endpoint.id,
    applicationId: endpoint.applicationId,
    url: endpoint.url,
    description: endpoint.description,
    subscribedEventTypes: endpoint.subscribedEventTypes,
    isActive: endpoint.isActive,
    createdAt: endpoint.createdAt,
  };
}

/**
 * @param {import('@prisma/client').Application} application
 * @param {{ url: string, description?: string, subscribedEventTypes: string[] }} input
 */
async function createEndpoint(application, { url, description, subscribedEventTypes }) {
  const limits = getPlanLimits(application.planTier);
  const existingCount = await prisma.endpoint.count({ where: { applicationId: application.id } });

  if (existingCount >= limits.maxEndpointsPerApplication) {
    throw new ApiError(
      403,
      'PLAN_LIMIT_EXCEEDED',
      `The ${application.planTier} plan allows at most ${limits.maxEndpointsPerApplication} endpoint(s) per application. Upgrade to add more.`
    );
  }

  const endpoint = await prisma.endpoint.create({
    data: {
      applicationId: application.id,
      url,
      description,
      subscribedEventTypes,
    },
  });

  return toPublicEndpoint(endpoint);
}

/** @param {string} applicationId */
async function listEndpoints(applicationId) {
  const endpoints = await prisma.endpoint.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });
  return endpoints.map(toPublicEndpoint);
}

/**
 * @param {import('@prisma/client').Endpoint} endpoint - already ownership-checked by tenantScopeGuard
 * @param {{ url?: string, description?: string, subscribedEventTypes?: string[], isActive?: boolean }} updates
 */
async function updateEndpoint(endpoint, updates) {
  const updated = await prisma.endpoint.update({ where: { id: endpoint.id }, data: updates });
  return toPublicEndpoint(updated);
}

/** @param {import('@prisma/client').Endpoint} endpoint - already ownership-checked by tenantScopeGuard */
async function deleteEndpoint(endpoint) {
  await prisma.endpoint.delete({ where: { id: endpoint.id } });
}

module.exports = { toPublicEndpoint, createEndpoint, listEndpoints, updateEndpoint, deleteEndpoint };
