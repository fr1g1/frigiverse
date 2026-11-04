# 0002. Cloudflare Tunnel + existing Traefik; separate `infra/` Compose project

- Status: Accepted
- Date: 2026-11-03

## Context
The home server (linux/amd64) already runs Traefik v3 with only an HTTP entrypoint, the Docker provider, an `traefik_net` network, and an unauthenticated dashboard published on `0.0.0.0:8080`. TLS is handled by Cloudflare; the exact current mode (tunnel vs proxied DNS) is to be verified. Secure cookies, OAuth redirects and PWAs require HTTPS end to end at the browser.

## Decision
- Target edge: Cloudflare Tunnel (`cloudflared`, token-based, public hostnames managed in the Zero Trust dashboard) → `http://traefik:80` → containers. No inbound router port forwarding.
- Traefik, cloudflared and Portainer live in `infra/compose.yml`, a Compose project separate from the app stack, versioned in this repository. App stacks join `traefik_net` as external and route via labels.
- Hardening: Traefik dashboard and Portainer bind only to `ADMIN_BIND_IP` (LAN/WireGuard); remote admin via the owner's existing WireGuard VPN; bounded log rotation; Docker socket proxy is an optional later step.
- Apps/API trust forwarded proto/host headers only from the proxy chain.

## Alternatives considered
- Orange-cloud proxy with Full (strict) and an origin certificate: works, but needs an open router port and exposes the home IP to anyone bypassing Cloudflare.
- Flexible SSL: plaintext between Cloudflare and home — rejected.
- Traefik inside the app Compose: app redeploys would take routing down.
- Cloudflare Access for Portainer: would put the Docker control plane on the internet and could not use `frigi.me` (0001).

## Consequences
- Setup guide must cover checking the current Cloudflare mode and migrating.
- Cloudflare caching and HTML-rewriting features must be disabled/bypassed for platform hosts.
