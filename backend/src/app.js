/**
 * Express app assembly. Kept separate from `index.js` (which just starts
 * the HTTP server) so the app instance itself can be imported directly into
 * tests without binding a real port.
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const endpointRoutes = require('./routes/endpointRoutes');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger, autoLogging: env.nodeEnv !== 'test' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/endpoints', endpointRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `No route matches ${req.method} ${req.path}`));
});

app.use(errorHandler);

module.exports = app;
