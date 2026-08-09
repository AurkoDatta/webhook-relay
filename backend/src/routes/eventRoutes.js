/**
 * /api/events/* — single-event detail. Listing is nested under
 * /api/applications/{id}/events (see applicationRoutes.js) since it's
 * naturally scoped to a parent application.
 */

const { Router } = require('express');
const eventController = require('../controllers/eventController');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { requireEventOwnership } = require('../middleware/tenantScopeGuard');
const { eventIdSchema } = require('../validators/eventSchemas');

const router = Router();

router.use(jwtAuthMiddleware);

router.get('/:id', validateRequest(eventIdSchema), requireEventOwnership, eventController.detail);

module.exports = router;
