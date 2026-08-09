/**
 * Singleton Prisma client. The API process and the worker process each run
 * as separate Node processes and therefore each get their own copy of this
 * module (and their own connection pool) — the singleton pattern here only
 * prevents *multiple* clients from being created within a single process
 * (e.g. if this module were required from several places, such as during
 * tests with hot-reloading).
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
