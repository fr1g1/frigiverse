# 0009. Route Handlers only for infrastructure endpoints

- Status: Accepted
- Date: 2026-11-03

## Context
Compose health checks need an endpoint in each Next.js container. The spec forbids a second business API in Next.js.

## Decision
Route Handlers are allowed only for infrastructure: `/healthz` (liveness only, `Cache-Control: no-store`, no API/DB dependency, excluded from service-worker caching) and routes required by official SDKs (e.g. a Sentry tunnel if adopted). Never business logic. `/healthz` ships in the template.

## Alternatives considered
- Probing a page: heavy and coupled to API availability through session checks.
- TCP-only check: misses hung processes.

## Consequences
- An API outage does not mark frontends unhealthy or cause restart loops.
