# 0008. Sentry for Next.js apps and the Fastify API, project per deployable

- Status: Accepted
- Date: 2026-11-03

## Context
The original spec covered only Next.js. The API owns all business logic, so its errors matter most. Sentry's free plan quota is shared across projects.

## Decision
- `@sentry/nextjs` per Next.js app; `@sentry/node` with the official Fastify integration for the API (5xx/unhandled only, `requestId` attached, tracing off or low sample rate).
- One Sentry project per deployable (`hub`, `hello`, `api`, future apps) with per-project rate limits.
- Shared scrubbing/conventions in `@platform/error-tracking`; source maps uploaded from CI with a CI-only token.

## Alternatives considered
- API errors in logs only: no aggregation or alerting.
- Single shared Sentry project: simpler, but mixed releases/ownership.

## Consequences
- One more DSN per deployable; quota must be watched.
