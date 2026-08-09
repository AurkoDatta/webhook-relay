/**
 * /api/applications/* — tenant namespace management, plus the nested
 * endpoint-creation/listing routes that hang off a specific application.
 */

const { Router } = require('express');
const applicationController = require('../controllers/applicationController');
const endpointController = require('../controllers/endpointController');
const eventController = require('../controllers/eventController');
const statsController = require('../controllers/statsController');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { requireApplicationOwnership } = require('../middleware/tenantScopeGuard');
const { createApplicationSchema, applicationIdSchema } = require('../validators/applicationSchemas');
const { createEndpointSchema } = require('../validators/endpointSchemas');
const { listEventsSchema } = require('../validators/eventSchemas');

const router = Router();

router.use(jwtAuthMiddleware);

router.post('/', validateRequest(createApplicationSchema), applicationController.create);
router.get('/', applicationController.list);

router.get(
  '/:id',
  validateRequest(applicationIdSchema),
  requireApplicationOwnership,
  applicationController.get
);

router.post(
  '/:id/rotate-secret',
  validateRequest(applicationIdSchema),
  requireApplicationOwnership,
  applicationController.rotateSecret
);

router.post(
  '/:id/rotate-api-key',
  validateRequest(applicationIdSchema),
  requireApplicationOwnership,
  applicationController.rotateApiKey
);

router.post(
  '/:id/endpoints',
  validateRequest(createEndpointSchema),
  requireApplicationOwnership,
  endpointController.create
);

router.get(
  '/:id/endpoints',
  validateRequest(applicationIdSchema),
  requireApplicationOwnership,
  endpointController.list
);

router.get(
  '/:id/events',
  validateRequest(listEventsSchema),
  requireApplicationOwnership,
  eventController.list
);

router.get(
  '/:id/stats',
  validateRequest(applicationIdSchema),
  requireApplicationOwnership,
  statsController.get
);

module.exports = router;
