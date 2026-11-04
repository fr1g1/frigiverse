# 0022. API error envelope with stable codes

- Status: Accepted
- Date: 2026-11-04

## Context
The spec required "structured errors" without a shape. The shared API client and every frontend need one predictable format, and the `requestId` correlation (§7.1) should reach the user-visible error.

## Decision
- Every non-2xx response from platform routes: `{ "error": { "code", "message", "requestId", "details"? } }`.
- `code` is a stable UPPER_SNAKE value defined in `@platform/shared` (`UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `INTERNAL`, …); `@platform/api-client` exposes typed errors.
- `details` only for validation issues. 5xx never expose stack traces, SQL or internal messages.
- Produced by a central Fastify error and not-found handler. Better Auth endpoints keep their documented format.

## Alternatives considered
- RFC 9457 `application/problem+json`: standard but more verbose for the same guarantees.
- Fastify default `{ statusCode, error, message }`: no stable codes or `requestId`.

## Consequences
- New error cases add a code to `@platform/shared` rather than ad-hoc strings.
