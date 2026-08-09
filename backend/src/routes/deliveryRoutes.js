/**
 * /api/deliveries/* — attempt history and manual replay for a single
 * delivery (one event/endpoint pair's delivery attempt chain).
 */

const { Router } = require('express');
const deliveryController = require('../controllers/deliveryController');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { requireDeliveryOwnership } = require('../middleware/tenantScopeGuard');
const { deliveryIdSchema } = require('../validators/deliverySchemas');

const router = Router();

router.use(jwtAuthMiddleware);

router.get('/:id/attempts', validateRequest(deliveryIdSchema), requireDeliveryOwnership, deliveryController.attempts);
router.post('/:id/replay', validateRequest(deliveryIdSchema), requireDeliveryOwnership, deliveryController.replay);

module.exports = router;
