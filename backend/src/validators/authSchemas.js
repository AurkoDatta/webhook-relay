/**
 * Request validation schemas for the auth routes. Kept separate from
 * authService so the "what shape of input is acceptable" concern doesn't
 * get tangled with "what does registration/login actually do".
 */

const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').max(200),
    email: z.string().trim().toLowerCase().email('Must be a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Must be a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

module.exports = { registerSchema, loginSchema };
