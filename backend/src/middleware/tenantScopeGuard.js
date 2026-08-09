/**
 * Multi-tenancy enforcement. Every route that touches a specific
 * application or endpoint must run one of these so a logged-in user can
 * never read or modify another tenant's data just by guessing an id — the
 * ownership check happens once, here, instead of being re-implemented (and
 * potentially forgotten) in every service function.
 */

const prisma = require('../db/prismaClient');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Loads the application named by `req.params.id` and verifies it belongs to
 * `req.user`. Attaches the application to `req.application` on success.
 */
const requireApplicationOwnership = asyncHandler(async (req, res, next) => {
  const application = await prisma.application.findUnique({ where: { id: req.params.id } });

  if (!application || application.userId !== req.user.id) {
    throw new ApiError(404, 'APPLICATION_NOT_FOUND', 'No application found with that id.');
  }

  req.application = application;
  return next();
});

/**
 * Loads the endpoint named by `req.params.id` along with its parent
 * application, and verifies the application belongs to `req.user`.
 * Attaches both to `req.endpoint` and `req.application`.
 */
const requireEndpointOwnership = asyncHandler(async (req, res, next) => {
  const endpoint = await prisma.endpoint.findUnique({
    where: { id: req.params.id },
    include: { application: true },
  });

  if (!endpoint || endpoint.application.userId !== req.user.id) {
    throw new ApiError(404, 'ENDPOINT_NOT_FOUND', 'No endpoint found with that id.');
  }

  req.endpoint = endpoint;
  req.application = endpoint.application;
  return next();
});

/**
 * Loads the event named by `req.params.id` along with its parent
 * application, and verifies the application belongs to `req.user`.
 * Attaches both to `req.event` and `req.application`.
 */
const requireEventOwnership = asyncHandler(async (req, res, next) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { application: true },
  });

  if (!event || event.application.userId !== req.user.id) {
    throw new ApiError(404, 'EVENT_NOT_FOUND', 'No event found with that id.');
  }

  req.event = event;
  req.application = event.application;
  return next();
});

/**
 * Loads the delivery named by `req.params.id` along with its endpoint and
 * the event's parent application, and verifies the application belongs to
 * `req.user`. Attaches the delivery (with `endpoint` nested) to
 * `req.delivery` and the application to `req.application`.
 */
const requireDeliveryOwnership = asyncHandler(async (req, res, next) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id: req.params.id },
    include: { endpoint: true, event: { include: { application: true } } },
  });

  if (!delivery || delivery.event.application.userId !== req.user.id) {
    throw new ApiError(404, 'DELIVERY_NOT_FOUND', 'No delivery found with that id.');
  }

  req.delivery = delivery;
  req.application = delivery.event.application;
  return next();
});

module.exports = {
  requireApplicationOwnership,
  requireEndpointOwnership,
  requireEventOwnership,
  requireDeliveryOwnership,
};
