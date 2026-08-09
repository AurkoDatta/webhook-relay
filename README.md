# Webhook Relay

A multi-tenant webhook delivery and relay service. Applications ingest events through an
authenticated API and the platform reliably fans them out to subscriber endpoints, with
signed payloads, automatic retries with exponential backoff, delivery logs, and manual
replay.

## How it works

- Each account is a tenant. A tenant creates one or more **applications** — isolated
  namespaces, each with its own signing secret and ingestion API key.
- An application registers **endpoints**: URLs that should receive events, each
  subscribed to specific event types (or `*` for everything).
- Tenants send events to `POST /api/ingest`, authenticated with the application's API
  key. Each event is persisted and fanned out to every matching, active endpoint as a
  separate delivery.
- A delivery worker signs the event payload with the application's secret and POSTs it
  to the endpoint. Failures are retried with exponential backoff (10s, 1m, 5m, 30m, 2h,
  6h, 12h), capped by the application's plan tier (Free: 3 attempts, Pro: 8 attempts).
  Every attempt — status code, latency, truncated response body — is recorded.
- From the dashboard you can inspect delivery history for any event and manually replay
  a delivery to a specific endpoint.

## Project layout

- `backend/` — Express API server, delivery worker, and Postgres/Redis access layer.
- `frontend/` — React dashboard for managing applications, endpoints, and viewing
  delivery activity and analytics.

## Prerequisites

- Node.js 18+
- [Homebrew](https://brew.sh) (macOS) for local Postgres and Redis — no Docker or
  managed cloud services required.

## Local setup

### 1. Postgres and Redis

```bash
brew install postgresql@16 redis
brew services start postgresql@16
brew services start redis
```

Create a role and databases for the app (the dev database and a separate one for
running tests):

```bash
psql postgres -c "CREATE ROLE webhook_relay WITH LOGIN PASSWORD 'CHANGE_ME' CREATEDB;"
psql postgres -c "CREATE DATABASE webhook_relay_dev OWNER webhook_relay;"
psql postgres -c "CREATE DATABASE webhook_relay_test OWNER webhook_relay;"
```

> If Redis fails to start with a "Can't load module" error from a Homebrew redis-stack
> bundle, comment out the `loadmodule` lines near the bottom of
> `/opt/homebrew/etc/redis.conf` and restart the service — this project only needs
> plain Redis (BullMQ + caching), not the bundled search/JSON/timeseries modules.

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL / TEST_DATABASE_URL password and JWT_SECRET
npm install
npm run prisma:migrate  # applies the schema and generates the Prisma client
```

The API server and the delivery worker are two independent processes — run each in its
own terminal:

```bash
npm run dev:api      # http://localhost:4000
npm run dev:worker   # consumes the delivery queue, no HTTP port
```

Run the unit tests (HMAC signing and the backoff schedule calculator):

```bash
npm test
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL defaults to http://localhost:4000
npm install
npm run dev             # http://localhost:5173
```

Open `http://localhost:5173`, register an account, create an application, and register
an endpoint. Point the endpoint at a URL you control (a local listener works fine for
testing), then send it an event:

```bash
curl -X POST http://localhost:4000/api/ingest \
  -H "Authorization: Bearer <your application's API key>" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"user.created","payload":{"id":"123"}}'
```

## Verifying webhook signatures

Every delivery includes two headers:

- `X-Webhook-Timestamp` — when the request was signed, as Unix time in milliseconds.
- `X-Webhook-Signature` — an HMAC-SHA256 signature, hex-encoded.

The signature is computed over `{timestamp}.{rawRequestBody}` using the application's
signing secret. To verify a delivery on your end, recompute the signature from the
**exact raw bytes** of the request body (not a re-serialized copy — whitespace and key
order matter) and compare it to the header using a constant-time comparison:

```js
const crypto = require('crypto');

function verifyWebhookSignature(secret, rawBody, timestamp, signatureHeader) {
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(signatureHeader, 'hex');

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

// In your route handler, using the raw body (e.g. express.raw() rather than
// express.json(), so the exact bytes are available):
const isValid = verifyWebhookSignature(
  process.env.WEBHOOK_SIGNING_SECRET,
  req.body, // raw string/buffer
  req.get('X-Webhook-Timestamp'),
  req.get('X-Webhook-Signature')
);
```

Reject the request if verification fails, and consider also rejecting if the timestamp
is too old (e.g. more than a few minutes in the past) to guard against replay attacks.

## Plan tiers

Plan tier is a plain field on each application, toggleable for demo purposes — there's
no billing integration. Limits are enforced as backend validation:

| | Free | Pro |
|---|---|---|
| Applications | 1 | 10 |
| Endpoints per application | 5 | 25 |
| Events per month | 1,000 | 100,000 |
| Max retry attempts | 3 | 8 |
| Delivery log retention | 7 days | 30 days |

## Tech stack

- **Backend:** Node.js, Express, BullMQ, ioredis, Prisma/PostgreSQL, JWT (httpOnly
  cookie sessions), bcrypt, Jest.
- **Frontend:** React (Vite), React Router, Axios, Tailwind CSS, Recharts.
- **Infra:** PostgreSQL and Redis, both self-hosted locally via Homebrew.
