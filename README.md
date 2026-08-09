# Webhook Relay

A multi-tenant webhook delivery and relay service. Applications ingest events through an
authenticated API and the platform reliably fans them out to subscriber endpoints, with
signed payloads, automatic retries with exponential backoff, delivery logs, and manual
replay.

## Status

This project is under active development. Setup instructions, architecture notes, and the
subscriber signature-verification guide will be filled in as each part lands.

## Project layout

- `backend/` — Express API server, delivery worker, and Postgres/Redis access layer.
- `frontend/` — React dashboard for managing applications, endpoints, and viewing delivery
  activity and analytics.
