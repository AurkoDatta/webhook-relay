/**
 * HTTP layer for auth: translates requests into authService calls and
 * shapes the response, including setting/clearing the httpOnly session
 * cookie. Business rules (password verification, token issuance) live in
 * authService, not here.
 */

const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { SESSION_COOKIE_NAME } = require('../middleware/jwtAuthMiddleware');

// SameSite=Lax is the CSRF mitigation for this project: state-changing
// requests still require the cookie, and Lax blocks it being sent on
// cross-site navigations/form submissions. A double-submit CSRF token is a
// deliberate simplification left out of scope for this demo.
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return res.status(201).json({ user });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.cookie(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
  return res.status(200).json({ user });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: env.cookieSecure });
  return res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = { register, login, logout, me };
