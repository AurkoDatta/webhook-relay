/**
 * Registration and login business logic. Framework-agnostic on purpose —
 * takes plain arguments and returns plain data, so it stays easy to unit
 * test without spinning up Express.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db/prismaClient');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Cost factor 12 balances hashing latency against brute-force resistance for
// human passwords — see hmac.js / apiKeyGenerator.js for why API keys use a
// fast hash instead.
const BCRYPT_COST_FACTOR = 12;

/**
 * Creates a new user account.
 * @param {{ name: string, email: string, password: string }} input
 * @returns {Promise<{ id: string, name: string, email: string }>}
 */
async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'EMAIL_IN_USE', 'An account with that email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  return user;
}

/**
 * Verifies credentials and issues a session JWT.
 * @param {{ email: string, password: string }} input
 * @returns {Promise<{ user: { id: string, name: string, email: string }, token: string }>}
 */
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
}

module.exports = { register, login };
