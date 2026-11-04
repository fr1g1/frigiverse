# Agent Instructions

These instructions apply to the entire repository. Read `project-spec.md` before making architectural changes, and check `docs/decisions/` for the rationale behind existing decisions.

## Core rules

1. Preserve the architecture defined in `project-spec.md`.
2. This is a pnpm + Turborepo monorepo with independent Next.js apps and one shared modular-monolith Fastify API.
3. Use TypeScript strict mode. Avoid `any`; if unavoidable, explain why and keep it narrowly scoped.
4. Use current stable, mutually compatible dependencies on Node.js 24 LTS. Verify current official documentation for version-sensitive integrations.
5. Do not silently replace technologies or introduce new infrastructure. If a chosen library turns out unstable or incompatible, stop and ask the user with options; record the outcome in `docs/decisions/`.
6. Do not introduce microservices, Kubernetes, runtime plugin loading, or speculative features.
7. Keep changes focused. Do not refactor unrelated code without a reason.
8. This repository is **public**. Never commit secrets, real credentials, private hostnames/IPs or personal data. Public example values only.

## Naming

- Deployable apps: directory `apps/<slug>`, package `@apps/<slug>`, hostname `<slug>.frigi.me` (production) / `<slug>.frigi.test` (local).
- Shared packages: directory `packages/<name>`, package `@platform/<name>`.
- The initial demo app is `hello` (not `test`).
- UI language is English only; do not add an i18n library without approval.

## Adding applications

- **Always create new applications from a template in `templates/`**, using `pnpm create:app` once it exists. `templates/next-app/` is the default.
- **Another frontend framework** may be used only via the framework integration contract (`project-spec.md` §10a): propose it with a concrete reason, get the user's approval, write an ADR, and create `templates/<framework>-app/` for the first app. Never introduce a framework without approval, never render frontend pages from the Fastify API, and never relax a contract requirement silently — stop and ask.
- Do not copy an existing app (Hub, Hello, or another future app) as the starting point.
- Follow `templates/next-app/README.md`.
- Replace all template placeholders. Search the generated app for leftover `__APP_` tokens.
- Register the new app in the Hub registry using typed metadata.
- Add its environment variables, trusted origin, Compose service with Traefik labels and pinned `<APP>_IMAGE_TAG`, Cloudflare Tunnel hostname, Firebase web stream, Sentry project and alert rule, and uptime monitor to the documentation/checklist.
- Verify the app is independently runnable and buildable.
- Do not make one app import another app's internal source code.

## Package boundaries

- Shared functionality belongs in `packages/`.
- Apps may depend on shared packages via `workspace:*`.
- Shared packages export TypeScript source (just-in-time); Next.js apps list them in `transpilePackages`; the API is bundled for production. Do not add per-package build steps without a reason recorded in `docs/decisions/`.
- Apps must not import from another app.
- Avoid circular dependencies.
- Import from package public exports; do not deep-import package internals unless explicitly exported.
- Keep shared packages platform-neutral where practical. Frontend-facing packages expose a framework-neutral core from the main entry and framework bindings as subpath exports (e.g. `@platform/analytics/react`). Do not put React/Next-only code in a package's main entry. UI theme tokens must stay available as plain CSS.
- Keep app-specific presentation and routing inside the app.

## Frontend conventions

- Use Next.js App Router.
- Prefer Server Components by default.
- Add `"use client"` only when browser interactivity, client state, or browser APIs require it.
- Keep route files thin; put feature logic in `features/<feature-name>/`.
- Keep business logic out of React components.
- Use the shared UI, auth-client and API-client packages.
- Every route has an access mode: `public` (no session lookup), `optional` (session lookup, no redirect) or `authenticated` (redirect to Hub sign-in with `returnTo`). Use the shared session helpers; do not hand-roll checks. Apps may mix modes.
- Session checks: Server Components fetch the session from the API via `API_INTERNAL_URL`, forwarding only the incoming cookie header (never log it); client components use the shared auth-client hook for interactive updates. UI checks are never authorization.
- Do not create a second business API using Next.js Route Handlers or Server Actions. **Route Handlers are allowed only for infrastructure endpoints**: `/healthz` liveness and routes required by an official SDK. Never put business logic in them.
- Never expose server-only secrets or database access to client components.
- Every app sets baseline security headers and the nonce-based CSP via the shared CSP builder in its request proxy file (from the template). Do not loosen CSP with `'unsafe-inline'`/`'unsafe-eval'` for scripts without approval.

## Backend and data

- Fastify is the shared API and owns business endpoints.
- Better Auth owns authentication/session flows according to its current documented integration.
- Every Fastify route declares `auth: "required" | "optional" | "none"`; the default is `required` and is enforced centrally. Mark a route `optional`/`none` only deliberately; such routes are rate-limited and must return only data safe for anonymous callers.
- Sign-up is open to any Google account: scope every data access to the session's user id, never to an id supplied by the browser.
- PostgreSQL access goes through `packages/database` and Drizzle.
- Application tables referencing users must cascade (or be explicitly cleaned up) on account deletion.
- Validate untrusted input at API boundaries with Zod.
- Return errors only through the central error handler using the shared envelope `{ error: { code, message, requestId, details? } }` with codes from `@platform/shared`. Add new codes there; never leak stack traces or internal messages in 5xx responses.
- Enforce authorization on the server. Never rely on hidden UI elements as access control.
- Do not run migrations automatically at startup or from CI against production. Production migrations run only through the profile-gated `migrate` service, after a backup.
- Migrations must be backward-compatible with the previous release (expand/contract): no drop/rename/type change of something the previous release uses in the same release. If unavoidable, say so in the PR and ask the user.
- Do not log passwords, OAuth secrets, cookies, session tokens or access tokens.

## Authentication and security

- Google OAuth is the initial (and only) sign-in provider. Development and production use separate OAuth clients.
- Use explicit trusted origins and CORS allowlists (Hub + registered apps only).
- Production cookies must be `Secure`, `HttpOnly` and scoped via `AUTH_COOKIE_DOMAIN` (production `frigi.me`, local `frigi.test`). Never hardcode the domain in code.
- Every host under `*.frigi.me` receives the session cookie. Never route a non-platform or untrusted service (Portainer, Traefik dashboard, third-party tools) under `frigi.me`.
- Never use a `frigi.me` subdomain for local development; use `*.frigi.test`.
- The sign-in `returnTo` must be validated against trusted origins in the Hub; Better Auth validates `callbackURL` again.
- Configure proxy trust narrowly (Cloudflare → Traefik → app); do not trust forwarded headers from arbitrary sources.
- Never put session tokens in localStorage.
- Follow current Better Auth CSRF, rate-limit and cookie guidance.
- Sessions: 30 days sliding (`expiresIn` 30 d, `updateAge` 1 d), no session cookie cache, so revocation is immediate. Do not change without approval.
- Do not add authentication bypasses or test-only sign-in endpoints to application code. E2E tests seed sessions in the test database from the test harness.
- Do not weaken production security to simplify local development.

## PWA and caching

- Hub and each app are independent PWAs with their own manifests and service-worker scopes.
- Never cache authenticated API responses, session endpoints, `/healthz`, or private user data.
- Keep offline behavior simple unless explicitly requested.
- Confirm service-worker scope and deployment base paths for each app.

## Deployment and infrastructure

- Two Compose projects: `infra/` (Traefik, cloudflared, Portainer) and the root app stack. Changing the app stack must not require redeploying infra.
- App services join the external `traefik_net` network and are routed with Traefik labels. PostgreSQL stays on an internal network.
- Admin surfaces (Portainer, Traefik dashboard) bind only to `ADMIN_BIND_IP` (LAN/WireGuard); never `0.0.0.0`, never through Cloudflare.
- Images are built in GitHub Actions and pushed to GHCR; only affected apps are rebuilt. Deploys are manual on the server.
- The production stack references images by pinned git-SHA tags from the server `.env` (`<APP>_IMAGE_TAG`), never `latest`. Rollback = previous tag + `docker compose up -d`.
- Every deployable exposes an unauthenticated, cheap health endpoint (`/healthz` for apps, `/health` for the API) that the external uptime checker monitors.
- CI workflows for pull requests run without secrets. Never use `pull_request_target` to build untrusted code. Secrets (`SENTRY_AUTH_TOKEN`, registry credentials) are only available to trusted `main` workflows.
- `NEXT_PUBLIC_*` values are baked in at build time and must never contain secrets. Server secrets are runtime-only and never passed as build args.

## Code quality

Before finishing a task:

1. Run formatting/lint checks relevant to the changes (ESLint + Prettier).
2. Run TypeScript type checking.
3. Run relevant unit/e2e tests.
4. Run the affected app/package build.
5. Fix errors introduced by the changes.
6. Update docs and `.env.example` when configuration changes.

Do not claim a check passed unless it was actually run. If a check cannot be run, state why.

## Git

- Default branch is `main`, protected: no direct pushes or force-pushes; changes go through PRs with required CI checks (lint, format, typecheck, unit, e2e, build).
- Agents always work on a short-lived branch (`feat/…`, `fix/…`, `chore/…`, `docs/…`), never on `main`. Commit, push or open PRs only when the user asks.
- Lefthook pre-commit hooks must pass; do not bypass them with `--no-verify` unless the user asks.

## Documentation and decisions

- Update `project-spec.md` only when the architecture itself changes.
- Update the relevant README when developer workflows or configuration change.
- Record important non-obvious architectural decisions in `docs/decisions/` (numbered ADRs; see `docs/decisions/README.md`).
- If a requirement is ambiguous and affects architecture/security, ask before choosing.

## Logging, analytics and error tracking

- Use `@platform/logger` for application logging. Server logs use Pino and JSON to stdout/stderr; never write log files inside app containers.
- Use request correlation IDs consistently in Fastify logs, error responses and Sentry events.
- Redact secrets and personal data. Never log passwords, OAuth credentials/codes, cookies, authorization headers, session tokens or API keys.
- Keep Docker `local` log rotation bounded. Logs are operational diagnostics, not durable archive.
- Use Portainer for inspection/log viewing/operations only. Docker Compose in Git is the deployment source of truth. Treat Docker socket access as root-equivalent and keep Portainer private.
- Use `@platform/analytics` for Firebase Analytics. **Do not load the Firebase SDK before consent.** Initialize only in the browser, never during SSR. Consent is a shared versioned cookie on the platform cookie domain; withdrawal must work from every app. Do not send PII or secrets. Do not use analytics as an audit log or source of truth.
- Use Sentry Cloud: the official `@sentry/nextjs` SDK per Next.js app and `@sentry/node` with the official Fastify integration for the API, one Sentry project per deployable. Follow the official per-app instrumentation requirements; keep shared conventions/helpers in `@platform/error-tracking` rather than hiding mandatory Sentry setup behind an abstraction.
- Sentry source-map upload credentials are build-time/CI secrets. Never expose them through `NEXT_PUBLIC_*` variables or bake them into images. Scrub sensitive event data before sending.
- Do not add Crashlytics to the web apps. Re-evaluate only if a native mobile app is introduced.
- Do not add Loki/Grafana/Prometheus/Tempo/PostHog or self-hosted error tracking unless the user explicitly approves the additional operational scope.

## Setup documentation and external services

- Maintain `docs/setup-guide.md` with exact local and cloud-console steps, required environment variables, callback/redirect URLs, verification steps and links to official docs.
- Clearly distinguish what the agent can implement from actions requiring the user's login, consent, billing approval, DNS/domain access or secret entry.
- Do not invent project IDs, DSNs, OAuth callback URLs, measurement IDs, API keys or secrets. Derive callback URLs from the installed library's official documentation and actual configured base URL.
- Before finishing, give the user a setup checklist grouped into local machine, Google/Firebase, Sentry, Cloudflare/DNS/Traefik, GitHub and deployment. State exact values to copy and where to put them.
- MCP servers are optional development aids, not runtime dependencies. Document official Firebase MCP, Sentry MCP and optional Google Analytics reporting MCP. Do not store OAuth tokens or service-account keys in the repository.
- Do not recommend the legacy Portainer MCP server as production-ready; use Docker CLI/Compose or the current officially supported Portainer integration if the user has the required edition. Never grant an agent unrestricted Docker/host control without explicit approval.
