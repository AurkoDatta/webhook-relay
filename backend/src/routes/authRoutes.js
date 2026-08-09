/**
 * /api/auth/* — dashboard registration and session management.
 */

const { Router } = require('express');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const jwtAuthMiddleware = require('../middleware/jwtAuthMiddleware');
const { registerSchema, loginSchema } = require('../validators/authSchemas');

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', jwtAuthMiddleware, authController.me);

module.exports = router;
