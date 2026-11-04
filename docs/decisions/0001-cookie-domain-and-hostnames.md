# 0001. Hostnames under `frigi.me`, session cookie scoped to `frigi.me`

- Status: Accepted
- Date: 2026-11-03

## Context
Hub, apps and the API are separate origins that must share one Better Auth session. That requires a cookie with a parent `Domain`, which browsers send to every host under that domain. The owner controls `frigi.me`; nothing unrelated runs under it.

## Decision
- Hub `hub.frigi.me`, apps `<slug>.frigi.me`, API `api.frigi.me`; apex `frigi.me` redirects to the Hub.
- Session cookie `Domain=frigi.me`, configured via `AUTH_COOKIE_DOMAIN` (never hardcoded).
- Invariant: every host under `*.frigi.me` is a trusted platform container. Portainer, the Traefik dashboard and any third-party service never live under `frigi.me`. The legacy `tmp.frigi.me` app is removed once Hello is deployed.

## Alternatives considered
- Dedicated sub-parent (`*.apps.frigi.me`, cookie on `apps.frigi.me`): better isolation, longer hostnames; unnecessary while the domain is dedicated.
- Separate registered domain: cleanest isolation, extra cost.

## Consequences
- Adding any non-platform service under `frigi.me` would expose sessions — it must go on a different domain.
- Local development must not use `frigi.me` subdomains (see 0005).
