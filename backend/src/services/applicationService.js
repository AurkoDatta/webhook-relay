/**
 * Application (tenant namespace) business logic: creation under plan
 * limits, listing, secret/API-key generation and rotation. Every function
 * here is scoped to a single user; ownership of a specific application is
 * already verified by `tenantScopeGuard` before these are called for
 * id-based operations.
 */

const prisma = require('../db/prismaClient');
const ApiError = require('../utils/ApiError');
const { getPlanLimits } = require('../config/planLimits');
const { generateApiKey, generateSigningSecret, maskSecret } = require('../utils/apiKeyGenerator');

/** Shapes an Application row for API responses: secret masked, hash never exposed. */
function toPublicApplication(application) {
  return {
    id: application.id,
    name: application.name,
    planTier: application.planTier,
    signingSecret: maskSecret(application.signingSecret),
    apiKeyPrefix: application.apiKeyPrefix,
    createdAt: application.createdAt,
  };
}

/**
 * Creates a new application for a user, enforcing the free/pro
 * max-applications limit. Returns the raw signing secret and API key
 * exactly once — the caller is responsible for surfacing them to the user
 * now, since they can never be retrieved again in full.
 *
 * @param {string} userId
 * @param {{ name: string }} input
 */
async function createApplication(userId, { name }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const existingCount = await prisma.application.count({ where: { userId } });

  // All new applications start on the free tier; plan tier is only changed
  // via the demo toggle described in applicationService.setPlanTier.
  const limits = getPlanLimits('free');
  if (existingCount >= limits.maxApplications) {
    throw new ApiError(
      403,
      'PLAN_LIMIT_EXCEEDED',
      `The free plan allows at most ${limits.maxApplications} application(s). Upgrade to create more.`
    );
  }

  const signingSecret = generateSigningSecret();
  const { fullKey, prefix, hash } = generateApiKey();

  const application = await prisma.application.create({
    data: {
      userId: user.id,
      name,
      signingSecret,
      apiKeyPrefix: prefix,
      apiKeyHash: hash,
    },
  });

  return { application: toPublicApplication(application), signingSecret, apiKey: fullKey };
}

/** @param {string} userId */
async function listApplications(userId) {
  const applications = await prisma.application.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return applications.map(toPublicApplication);
}

/** @param {import('@prisma/client').Application} application - already ownership-checked by tenantScopeGuard */
function getApplication(application) {
  return toPublicApplication(application);
}

/**
 * Regenerates the HMAC signing secret. Returns the raw value once.
 * @param {import('@prisma/client').Application} application
 */
async function rotateSigningSecret(application) {
  const signingSecret = generateSigningSecret();
  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { signingSecret },
  });
  return { application: toPublicApplication(updated), signingSecret };
}

/**
 * Regenerates the ingestion API key. Returns the raw value once. Separate
 * from signing-secret rotation because leaking an API key and wanting a
 * fresh HMAC secret are operationally distinct events for a tenant.
 * @param {import('@prisma/client').Application} application
 */
async function rotateApiKey(application) {
  const { fullKey, prefix, hash } = generateApiKey();
  const updated = await prisma.application.update({
    where: { id: application.id },
    data: { apiKeyPrefix: prefix, apiKeyHash: hash },
  });
  return { application: toPublicApplication(updated), apiKey: fullKey };
}

module.exports = {
  toPublicApplication,
  createApplication,
  listApplications,
  getApplication,
  rotateSigningSecret,
  rotateApiKey,
};
