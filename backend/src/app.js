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
const ingestRoutes = require('./routes/ingestRoutes');
const eventRoutes = require('./routes/eventRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
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
app.use(pinoHttp({ logger, autoLogging: env.nodeEnv !== 'test' }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Each router applies its own express.json() body-size limit rather than
// one global parser, because /api/ingest needs a much tighter cap (256kb)
// than the dashboard management routes (1mb) — and a request body can only
// be read once, so a single shared parser couldn't offer two different
// limits.
app.use('/api/auth', express.json({ limit: '1mb' }), authRoutes);
app.use('/api/applications', express.json({ limit: '1mb' }), applicationRoutes);
app.use('/api/endpoints', express.json({ limit: '1mb' }), endpointRoutes);
app.use('/api/events', express.json({ limit: '1mb' }), eventRoutes);
app.use('/api/deliveries', express.json({ limit: '1mb' }), deliveryRoutes);
app.use('/api/ingest', ingestRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', `No route matches ${req.method} ${req.path}`));
});

app.use(errorHandler);

module.exports = app;
