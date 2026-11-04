# 0005. Native local dev on `*.frigi.test` with mkcert HTTPS

- Status: Accepted
- Date: 2026-11-03

## Context
Google OAuth only allows `http` redirect URIs for `localhost`; browsers do not reliably share cookies across `*.localhost`; a `frigi.me` dev subdomain would receive the production cookie.

## Decision
- Local hostnames `hub.frigi.test`, `hello.frigi.test`, `api.frigi.test` (reserved `.test` TLD) via `/etc/hosts`; cookie domain `frigi.test`.
- mkcert wildcard certificate; apps and API run natively with HTTPS on fixed ports (3000, 3001, 4000; future apps 3002+). Only PostgreSQL runs in Docker (Docker Engine).
- Separate dev Google OAuth client, secrets, database and env files. Analytics disabled; Sentry disabled or `development`.
- Optional local run of the production Compose stack as a smoke test.

## Alternatives considered
- Local Traefik for port-less URLs: extra container, fragile host networking.
- Everything in Compose: slow hot reload, complex tooling inside containers.

## Consequences
- One-time setup: mkcert, hosts entries, dev OAuth client.
- Production cookie settings are never weakened for development.
