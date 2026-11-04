# Frigiverse

A self-hostable personal application platform: a pnpm + Turborepo monorepo with independent Next.js apps (Hub, Hello, future apps), one shared Fastify API with Better Auth (Google sign-in), PostgreSQL via Drizzle, deployed with Docker Compose behind Cloudflare Tunnel and Traefik.

> **Status:** specification phase. The architecture is defined; implementation has not started. Commands below describe the target developer workflow.

## Documents

| Document | Purpose |
|---|---|
| [`project-spec.md`](project-spec.md) | Architecture, technology choices, requirements, acceptance criteria |
| [`AGENTS.md`](AGENTS.md) | Repository-wide rules for Claude Code and other coding agents |
| [`docs/setup-guide.md`](docs/setup-guide.md) | Local and cloud setup checklist, environment variables, verification, optional MCP integrations |
| [`docs/decisions/`](docs/decisions/) | Architecture decision records (why things are the way they are) |
| [`templates/next-app/`](templates/next-app/) | Canonical starter for new independent Next.js apps |

## Hostnames

| | Production | Local development |
|---|---|---|
| Hub | `https://hub.frigi.me` | `https://hub.frigi.test:3000` |
| Hello | `https://hello.frigi.me` | `https://hello.frigi.test:3001` |
| API | `https://api.frigi.me` | `https://api.frigi.test:4000` |
| Future apps | `https://<slug>.frigi.me` | `https://<slug>.frigi.test:3002+` |

## Target developer workflow

```bash
# prerequisites: Node 24 (see .nvmrc), pnpm (packageManager field), Docker Engine, mkcert
pnpm install
docker compose -f compose.dev.yml up -d   # PostgreSQL for development
pnpm db:migrate
pnpm dev                                  # Hub, Hello and API with HTTPS on *.frigi.test
```

Other scripts: `pnpm dev:hub`, `pnpm dev:hello`, `pnpm dev:api`, `pnpm build`, `pnpm lint`, `pnpm format`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm db:generate`, `pnpm create:app`.

See [`docs/setup-guide.md`](docs/setup-guide.md) for the one-time local setup (hosts entries, certificates, env files, OAuth client).

## Operational decisions (summary)

- Each Next.js app, the Fastify API and PostgreSQL run in their own containers (root `compose.yml`). Traefik, cloudflared and Portainer run in a separate `infra/` Compose project.
- Docker Compose files in Git are the source of truth; Portainer (LAN/WireGuard only) is for visibility and operations.
- Images are built by GitHub Actions (only affected apps) and pushed to GHCR; deploys are manual with pinned SHA image tags (`docker compose pull && docker compose up -d`); rollback = previous tag.
- Pino emits structured logs to stdout/stderr; the Docker `local` driver keeps bounded rotating logs.
- Firebase Analytics / GA4 behind an explicit consent gate (SDK not loaded before consent).
- Sentry Cloud for browser, Next.js server and API errors.
- Nightly local PostgreSQL backups; no off-site copy yet (accepted risk).
- No Loki/Grafana/Prometheus/Tempo/PostHog/Crashlytics in the initial platform.

## License

[MIT](LICENSE)
