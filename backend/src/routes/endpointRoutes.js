/**
 * /api/endpoints/* — update/delete for a specific subscriber endpoint.
 * Creation and listing are nested under /api/applications/{id}/endpoints
 * (see applicationRoutes.js) since they're naturally scoped to a parent
 * application at the time of the request.
 */

const { Router } = require('express');
const endpointController = require('../controllers/endpointController');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { requireEndpointOwnership } = require('../middleware/tenantScopeGuard');
const { updateEndpointSchema, endpointIdSchema } = require('../validators/endpointSchemas');

const router = Router();

router.use(jwtAuthMiddleware);

router.put(
  '/:id',
  validateRequest(updateEndpointSchema),
  requireEndpointOwnership,
  endpointController.update
);

router.delete(
  '/:id',
  validateRequest(endpointIdSchema),
  requireEndpointOwnership,
  endpointController.remove
);

module.exports = router;
