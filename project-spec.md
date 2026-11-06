# Frigiverse — Project Specification

> Implementation brief for Claude Code. This document defines the intended architecture and initial scope.
> Read this together with the root `AGENTS.md`. Rationale for non-obvious decisions lives in `docs/decisions/`.
> Last architecture review: 2026-11-04.

## 1. Product vision

Build a self-hostable personal application platform as a TypeScript monorepo, published as a **public GitHub repository** under the MIT license.

- **Hub** (`apps/hub`, `hub.frigi.me`) is the central launcher, sign-in entry point and account page.
- **Hello** (`apps/hello`, `hello.frigi.me`) is a separate, independently built application displaying `Hello, world!`. (Earlier drafts called it "Test"; it was renamed to avoid collisions with `pnpm test`, the `test` Turborepo task and staging-like hostnames.)
- Future applications will be added as independent frontends at `<slug>.frigi.me` using the same conventions.
- Not everything requires sign-in. Every route declares an **access mode** — `public`, `optional` (works signed out, more when signed in) or `authenticated` — and an app may mix modes freely (§5 "Access modes").
- Next.js is the default frontend framework. Another framework may be used for an app (e.g. a single-page app) only through the **framework integration contract** (§10a), which keeps it inside the same workflow.
- Applications share authentication, design-system components, API clients, types, validation schemas, and infrastructure.
- The project is a **monorepo with independent applications and a modular-monolith backend**. It is not a single frontend with many feature flags and not a microservices system.
- **Sign-up is open**: any Google account may register. The platform must therefore be safe for untrusted users (per-user data isolation, rate limiting, privacy policy, account deletion).

The initial goal is a reliable foundation, not a feature-rich product.

## 2. Technology decisions

Use current stable, mutually compatible versions. Before implementation, inspect official documentation and verify compatibility. Do not blindly copy outdated examples.

**If verification shows a chosen technology is not stable or not compatible (e.g. HeroUI v3, Serwist with the current Next.js bundler), stop and ask the user with options. Do not silently substitute. Record the outcome in `docs/decisions/`.**

The verification of 2026-11-06 and the resulting version pins are recorded in `docs/decisions/0024-verified-toolchain-2026-11.md` (TypeScript 6.0.x, ESLint 9, pnpm 11, `@serwist/turbopack`, re-authentication before account deletion).

| Area | Technology |
|---|---|
| Language | TypeScript 6.0.x, strict mode (not 7 until typescript-eslint supports it); tsconfig `module: esnext`, `moduleResolution: bundler`, `paths` without `baseUrl` |
| Runtime | Node.js 24 LTS (pinned via `.node-version`, `engines`, Docker base images; developers use fnm) |
| Monorepo | pnpm 11 workspaces (version pinned via `packageManager`/`devEngines.packageManager`; settings in `pnpm-workspace.yaml`, build scripts approved via `allowBuilds`), pnpm catalogs for shared dependency versions |
| Task orchestration | Turborepo |
| Web applications | Next.js App Router (default); other frameworks only via the framework integration contract (§10a) and a user-approved ADR |
| UI | HeroUI v3 |
| Styling | Tailwind CSS 4 |
| Backend | Fastify |
| API | REST |
| Validation | Zod |
| Authentication | Better Auth, Google OAuth |
| Database | PostgreSQL (current stable major) |
| ORM | Drizzle ORM |
| PWA | Serwist via `@serwist/turbopack` (Next 16 builds with Turbopack); fallback `@serwist/next` with webpack builds only if the spike fails (ask first) |
| Realtime | No implementation initially; keep backend extensible for WebSockets |
| Tests | Vitest for unit tests; Playwright for browser/e2e tests |
| Lint / format | ESLint 9 (flat config, `eslint-config-next`, typescript-eslint; not 10 until `eslint-config-next` supports it) + Prettier, shared via `packages/config` |
| Git hooks | Lefthook (format + lint on staged files) |
| Dependency updates | Renovate (grouped monorepo updates, pnpm catalog aware) |
| CI / registry | GitHub Actions; images published to GitHub Container Registry (GHCR) |
| API bundling | tsdown (production bundle of `apps/api`), `tsx` in development |
| Deployment | Docker Compose on a home server (linux/amd64); each app/service in its own container |
| Edge / TLS | Cloudflare (DNS + Cloudflare Tunnel) → existing Traefik v3 (HTTP entrypoint) → containers |
| Container management | Portainer CE for visibility and operations; Compose/Git remains source of truth |
| Logging | Pino structured JSON to stdout/stderr; Docker `local` logging driver with rotation; inspect via Portainer/Docker CLI |
| Product analytics | Firebase Analytics (GA4) for web, through shared `@platform/analytics`, behind a consent gate |
| Error tracking | Sentry Cloud: `@sentry/nextjs` per Next.js app and `@sentry/node` for the Fastify API, with shared conventions in `@platform/error-tracking` |

Do not introduce Expo in the initial implementation. Keep business logic and API contracts platform-neutral where practical so a future Expo app can reuse them.

## 3. Repository structure

Create this structure (minor adjustments are acceptable if required by current tooling):

```text
project/
├── apps/
│   ├── hub/                       # Next.js Hub                 (@apps/hub)
│   ├── hello/                     # Independent Next.js app     (@apps/hello)
│   └── api/                       # Shared Fastify API + Better Auth (@apps/api)
│
├── packages/
│   ├── ui/                        # Shared web design system, based on HeroUI (@platform/ui)
│   ├── auth-client/               # Shared Better Auth frontend client
│   ├── api-client/                # Shared API client and typed helpers
│   ├── shared/                    # Shared types, constants, Zod schemas
│   ├── database/                  # Drizzle schema, connection, migrations
│   ├── logger/                    # Pino logger conventions
│   ├── analytics/                 # Firebase Analytics + consent state
│   ├── error-tracking/            # Sentry conventions/scrubbing helpers
│   └── config/                    # Shared TypeScript/ESLint/Prettier configuration
│
├── templates/
│   ├── next-app/                  # Canonical template for future applications (default)
│   └── <framework>-app/           # Only if another framework is approved (§10a)
│
├── infra/                         # Separate Compose project: Traefik, cloudflared, Portainer
│   └── compose.yml
│
├── docs/
│   ├── setup-guide.md
│   └── decisions/                 # Architecture decision records (ADRs)
│
├── .github/workflows/             # CI (lint/typecheck/test/build, affected image builds)
├── AGENTS.md
├── project-spec.md
├── LICENSE                        # MIT
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── compose.yml                    # Platform app stack (apps, API, PostgreSQL, backups, migrate)
├── lefthook.yml
├── renovate.json
└── README.md
```

### Workspace rules

- **Project name:** Frigiverse. GitHub repository `frigiverse` (public from day one); root `package.json` name `frigiverse` with `"private": true`; images `ghcr.io/fr1g1/frigiverse-<app>`.
- Every folder under `apps/` is an independently runnable/buildable application with its own `package.json`.
- **Package scopes:** deployable apps use `@apps/<slug>`; shared packages use `@platform/<name>`. The app generator rejects slugs that collide with existing apps, packages or reserved names (`api`, `hub`, `www`, `admin`, `portainer`, `traefik`, ...).
- Internal packages are consumed using `workspace:*`.
- Apps must not import source files from another app.
- Shared functionality belongs in `packages/`.
- Do not create one backend per frontend.
- Do not introduce microservices, Kubernetes, or unnecessary infrastructure.
- Each app is deployable independently and runs in its own Docker container. The shared API and PostgreSQL also run in separate containers.
- Docker Compose configuration in Git is the source of truth for deployment. Portainer is for visibility and operational tasks, not an alternative source of configuration.
- Use clear package exports; avoid deep imports into another package's internals.
- **Framework-neutral cores:** frontend-facing packages (`auth-client`, `api-client`, `analytics`, `error-tracking`, the CSP builder, access-mode helpers) expose a framework-neutral TypeScript core from the main entry, with framework bindings as explicit subpath exports (e.g. `@platform/analytics/react`, `@platform/auth-client/next`). `packages/ui` exports its theme tokens as plain CSS (e.g. `@platform/ui/theme.css`) usable without React, in addition to the React/HeroUI components. This keeps a future non-Next app (§10a) on the same packages.

### Shared package consumption (just-in-time)

See `docs/decisions/0013-jit-packages-bundled-api.md`.

- Shared packages export TypeScript source directly via `package.json` `exports` (no per-package build step).
- Next.js apps compile them with `transpilePackages`; other approved frameworks use their bundler's equivalent (documented in that framework's ADR/template).
- `apps/api` runs with `tsx watch` in development and is bundled with tsdown for production; native/optional dependencies (e.g. `pg`, Pino transports) are marked external and installed in the image.
- `typecheck`, `lint` and `test` still run per package through Turborepo.

## 4. Applications

### 4.1 Hub (`apps/hub`)

The Hub is the platform home screen and the only sign-in UI.

Implement:

- Platform title and simple welcome area.
- Google sign-in when signed out (`/sign-in`, see §5 return flow).
- Current user's basic public profile when signed in.
- Sign-out.
- **Account deletion** (self-service, with explicit confirmation) — see §5.
- **Privacy policy page** (`/privacy`) linked from every app's footer — see §7.4.
- An application launcher card/link for each registered app (initially Hello).
- Loading and error states for session retrieval.
- App URLs come from environment configuration.
- Access modes: home and launcher `optional` (signed-out visitors see public apps and a sign-in prompt), `/privacy` and `/sign-in` `public`, account/profile pages `authenticated`.

Do not implement dynamic plugin loading, app marketplace, user administration, complex dashboard, or role management.

### 4.2 Hello (`apps/hello`)

A separate Next.js application, not a route inside Hub.

Implement:

- A page displaying `Hello, world!` — access mode `optional`: visible to everyone; shows the user's basic public profile when signed in.
- Link back to Hub.
- If signed out, link to the Hub sign-in flow with a `returnTo` pointing back to Hello.
- Confirm that a session created in Hub is recognized in Hello without another login.

Keep this application intentionally minimal. It validates independent frontend deployment and cross-subdomain authentication.

## 5. Authentication

Use Better Auth with Google OAuth.

### Requirements

- Google is the only sign-in provider initially.
- Better Auth runs in the shared Fastify API.
- Persist users, accounts, and sessions in PostgreSQL using Better Auth's supported Drizzle integration.
- Implement sign-in, sign-out, current-session retrieval and self-service account deletion (Better Auth's documented user-deletion feature, with confirmation).
- **Re-authentication before deletion:** Better Auth requires a fresh session (default `freshAge` 1 day) to delete a social-only account. If the session is not fresh, the Hub sends the user through Google sign-in again (`returnTo` the delete page), then asks for a typed confirmation (`DELETE`). Do not set `freshAge: 0` and do not add email verification.
- **Session lifetime** (`docs/decisions/0023-session-lifetime.md`): 30 days, sliding — `expiresIn` 30 days, `updateAge` 1 day. Do not enable Better Auth's session cookie cache, so sign-out, account deletion and session revocation take effect on the next request.
- **Open sign-up:** any Google account may register. Consequently:
  - Every API endpoint that touches user data scopes it to the session's user id; never accept a user id from the browser as authority.
  - Enable Better Auth rate limiting with persistent (database) storage, not in-memory only.
  - App tables referencing users must cascade (or be explicitly cleaned up) on user deletion.
- Frontends use `packages/auth-client`, not duplicated configuration.
- Protected backend endpoints validate the session server-side.
- Never trust user identity or permissions supplied by the browser.

### Access modes

See `docs/decisions/0017-access-modes.md`.

Every frontend route and every API route declares one of:

| Mode | Who | Session handling (frontend) | API route |
|---|---|---|---|
| `public` | Anyone; output never depends on the user | No session lookup | `auth: "none"` |
| `optional` | Anyone; extra features when signed in | Server-side lookup, no redirect; render signed-out and signed-in variants | `auth: "optional"` — handler receives `user \| null` |
| `authenticated` | Signed-in users only | Server-side lookup; redirect to Hub `/sign-in?returnTo=…` when signed out | `auth: "required"` — 401 when signed out |

- An app may mix modes per route; the app's overall `access` in the Hub registry (§15) describes its entry point.
- **API default is `auth: "required"`.** A route is public/optional only when explicitly declared; a missing declaration fails safe. Enforce this centrally (Fastify route option + hook), not per handler.
- `public`/`optional` API routes are rate-limited and must never return another user's data or anything not safe for anonymous callers.
- Shared helpers (framework-neutral core, Next binding): e.g. `getOptionalSession()` and `requireSession()`; frontends do not hand-roll session checks.
- Frontend access modes are UX only; the API enforces authorization.
- Anonymous users who persist data (guest accounts, Better Auth anonymous plugin) are out of scope until an app needs it.

### Hostnames and cookie scope

See `docs/decisions/0001-cookie-domain-and-hostnames.md`.

| Environment | Hub | Hello | API | Cookie domain |
|---|---|---|---|---|
| Production | `https://hub.frigi.me` | `https://hello.frigi.me` | `https://api.frigi.me` | `frigi.me` |
| Local dev | `https://hub.frigi.test:3000` | `https://hello.frigi.test:3001` | `https://api.frigi.test:4000` | `frigi.test` |

- The apex `frigi.me` redirects to `https://hub.frigi.me` (Traefik/Cloudflare rule).
- Cookie domain is configured via environment (`AUTH_COOKIE_DOMAIN`); never hardcode it in code.
- **Invariant: every host under `*.frigi.me` must be a trusted container of this platform.** Third-party or unrelated services (including Portainer and the Traefik dashboard) must never be served under `frigi.me`, because they would receive the session cookie. The legacy `tmp.frigi.me` test app is to be removed once Hello is deployed.

Security requirements:

- `HttpOnly` and `Secure` cookies in production.
- Explicit trusted origins (`TRUSTED_ORIGINS`), CORS allowlist with credentials — Hub, every registered app, nothing else.
- Follow Better Auth's current CSRF/origin protection guidance.
- The API sits behind Cloudflare and Traefik; configure Fastify `trustProxy` narrowly so Better Auth derives `https` and the correct host from forwarded headers. Do not trust forwarded headers from arbitrary sources.
- Never store session tokens in localStorage.
- Never log secrets, cookies, OAuth tokens, or session tokens.

### Session checks in Next.js

See `docs/decisions/0004-server-side-session-checks.md`.

- Applies to `optional` and `authenticated` routes; `public` routes skip the lookup.
- Server Components retrieve the session by calling the API's Better Auth session endpoint over the internal Docker network (`API_INTERNAL_URL`, e.g. `http://api:4000`), forwarding only the incoming request's cookie header. Never log or persist the forwarded cookie.
- Client components use the shared `auth-client` hook for interactive updates (sign-in/sign-out).
- The Next.js session check only shapes UI/redirects. The API re-validates the session on every protected endpoint.

### Sign-in return flow

See `docs/decisions/0006-hub-sign-in-return-flow.md`.

1. A signed-out app links to `https://hub.frigi.me/sign-in?returnTo=<absolute URL in the app>`.
2. Hub validates `returnTo`: must parse as an absolute `https` URL (in production) whose origin is in the trusted-origins list; otherwise fall back to the Hub home. Reject protocol-relative, `javascript:` and other schemes.
3. Hub starts Google sign-in via `auth-client` with `callbackURL = returnTo`. Better Auth validates `callbackURL` against `trustedOrigins` again server-side.
4. Sign-out may be triggered from any app; other apps reflect it on their next session check.

### Local development

See `docs/decisions/0005-local-development.md`.

- Local domain: `*.frigi.test` (reserved `.test` TLD) resolved via `/etc/hosts` to `127.0.0.1`. Never use a subdomain of `frigi.me` for development (the production cookie would leak to local servers).
- HTTPS via a locally trusted mkcert wildcard certificate for `*.frigi.test` (Google OAuth requires HTTPS for non-`localhost` redirect URIs; Secure cookies and service workers need a secure context).
- Apps and API run natively (`pnpm dev`) serving HTTPS on fixed ports (Hub 3000, Hello 3001, API 4000; future apps 3002+). Only PostgreSQL runs in Docker for dev.
- Separate Google OAuth client, Better Auth secret, database and env files for development. Analytics is disabled in development; Sentry is disabled or uses `environment=development`.
- Never weaken production cookie settings to make local development easier.
- Optional: run the production Compose stack locally (separate volume) as a pre-deploy smoke test.

### Google OAuth

Provide `.env.example` entries for:

- Google OAuth client ID and secret.
- Better Auth secret and base URL.
- Database URL.
- Cookie parent domain.
- Allowed frontend origins.
- Hub and app public URLs.

Document Google Cloud Console setup (separate dev and prod OAuth clients; consent screen publishing for open sign-up, which requires the privacy policy URL) and the exact Better Auth callback URL required by the installed version. Do not guess the callback path; derive it from the installed Better Auth version's documentation and the configured base URL.

## 6. Backend

Use one Fastify app in `apps/api`.

Responsibilities:

- Register Better Auth routes using the current documented Fastify integration.
- `GET /health` health endpoint (liveness; a separate readiness check may verify DB connectivity).
- `GET /api/me` protected example endpoint (`auth: "required"`) returning a safe public profile.
- Route-level access declaration (`auth: "required" | "optional" | "none"`, default `required`) enforced by a central hook (§5 "Access modes").
- CORS, cookies, security headers (`@fastify/helmet` or equivalent), structured errors.
- **Error envelope** (`docs/decisions/0022-api-error-envelope.md`): every non-2xx response from platform routes has the shape `{ "error": { "code": "UPPER_SNAKE_CODE", "message": "…", "requestId": "…", "details"?: … } }`. Codes are stable, defined once in `@platform/shared` (e.g. `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `RATE_LIMITED`, `INTERNAL`) and typed in `@platform/api-client`. `details` is used only for validation issues (field paths and messages). 5xx responses never contain stack traces, SQL or internal messages. A central Fastify error/not-found handler produces the envelope; Better Auth's own endpoints keep their documented response format.
- Zod validation where applicable.
- Modular route registration so future domain modules can be added.
- Sentry via `@sentry/node` and its official Fastify integration (see §7.5).

Do not implement WebSockets yet. Keep the service structure ready for a future WebSocket endpoint/server without adding unnecessary abstractions now. (Cloudflare Tunnel supports WebSockets.)

## 7. Logging, analytics, error tracking and privacy

Keep the first version deliberately small. Do not add Loki, Grafana, Prometheus, Tempo, OpenTelemetry collectors, PostHog, or a self-hosted error-tracking server initially.

### 7.1 Structured application logging

- Create `packages/logger` and expose it as `@platform/logger`.
- Use Pino for server-side structured logging in Fastify and Next.js Node.js runtimes.
- Emit newline-delimited JSON to stdout/stderr; do not write application log files inside containers.
- Include consistent fields where available: `service`/`appId`, `environment`, `release`, `time`, `level`, `message`, `requestId`, and `traceId` if one exists.
- Fastify request logs should use/request a correlation ID and include it in error logs, error responses and Sentry events.
- Browser code must not import server-only Pino transports or secrets. If a browser logger API is exposed, keep it lightweight and do not silently ship arbitrary browser console output to the server.
- Never log passwords, OAuth codes/secrets, cookies, authorization headers, session tokens, API keys, or unnecessary personal data. Redact sensitive request fields.
- Development may use readable pretty output; production uses JSON. Do not add a network log collector in the initial deployment.

### 7.2 Docker log retention and viewing

- Configure Docker services with the `local` logging driver and bounded rotation (initial default: `max-size: 10m`, `max-file: 5`; tune if actual volume requires it). Applies to both the app stack and the `infra/` stack.
- View logs through Portainer's container log view or `docker logs`; document `docker logs -f`, `--tail`, and timestamps.
- Docker logs are bounded operational diagnostics, not an archival or disaster-recovery system. Do not promise indefinite retention.

### 7.3 Container operations with Portainer

- Portainer CE runs in the separate `infra/` Compose project, with a persistent data volume.
- Its UI is bound only to LAN/WireGuard addresses (configured `ADMIN_BIND_IP`), never `0.0.0.0`, and never routed through Traefik/Cloudflare or served under `frigi.me`. Remote access is through the user's existing WireGuard VPN.
- Treat access to the Docker socket as effectively root-level access to the host. Protect Portainer credentials and the endpoint accordingly.
- Use Portainer for container status, logs, resource stats, console access and operational restarts.
- Do not make undocumented manual changes in Portainer that cause configuration drift.

### 7.4 Firebase Analytics, consent and privacy

See `docs/decisions/0010-analytics-consent.md`.

- Use Firebase Analytics / GA4 for the web apps: **one Firebase project, one GA4 property, one web data stream (Firebase Web App) per frontend app.** Every event carries an `app_id` parameter, registered in GA4 as a custom dimension, so reports can be split per app or combined.
- `packages/analytics` (`@platform/analytics`) is the only application-facing integration. It provides a typed event API, isolates Firebase SDK details, and owns consent state.
- **No Firebase SDK is loaded before consent.** Do not use Consent Mode "advanced" cookieless pings. Initialize only in the browser, never during Server Component/SSR execution, and avoid duplicate initialization during client navigation/hot reload.
- Consent UI: a small custom banner (shared component in `@platform/ui`) with equally prominent "Accept analytics" and "Reject" actions, and a "Privacy settings" link in every app footer to change/withdraw consent.
- Consent storage: one non-HttpOnly, versioned cookie scoped to the platform cookie domain (e.g. `platform_consent`), shared by all apps. Bumping the version re-prompts. Withdrawal disables collection, deletes `_ga*` cookies and stops loading the SDK.
- Analytics is disabled by environment in local development.
- Use an explicit event naming convention such as `object.action` and document a small initial event catalogue. Do not enable broad automatic interaction tracking by default.
- Do not send email addresses, names, auth tokens, session IDs, free-text form values, or other sensitive/personal data as event parameters. Never use email as User-ID.
- Analytics is for aggregate product usage, not authoritative business events, audit records, or application state.
- **Privacy policy:** Hub serves `/privacy`, drafted from the actual implementation (data stored by Better Auth, analytics after consent, Sentry, processors Google/Sentry/Cloudflare, retention, user rights, account deletion, data export on request). Controller name and contact are configuration placeholders filled in by the user; the draft requires the user's legal review.

### 7.5 Sentry error tracking

See `docs/decisions/0008-error-tracking-scope.md`.

- Use Sentry Cloud; do not self-host Sentry/GlitchTip initially.
- One Sentry project per deployable: `hub`, `hello`, `api` (and one per future app). Set per-project rate limits because the plan's error quota is shared.
- Integrate the official `@sentry/nextjs` SDK separately in each Next.js app according to current documentation, covering browser and server runtimes (including `instrumentation.ts`, client instrumentation and `global-error.tsx` as required by the installed version).
- Integrate `@sentry/node` in the API using the official Fastify integration. Report 5xx/unhandled errors, not 4xx validation errors. Attach the Pino `requestId`. Tracing off or low sample rate initially.
- Shared event filtering, safe context conventions, release/environment naming and helper APIs live in `packages/error-tracking` (`@platform/error-tracking`), without hiding SDK-required setup files.
- Upload source maps during CI production builds using `SENTRY_AUTH_TOKEN` (build-time secret, only available to trusted `main` workflows). Never expose it via `NEXT_PUBLIC_` or include it in a runtime bundle or image.
- DSNs are public client configuration; still validate project/environment assignment.
- Filter sensitive data: no request bodies, cookies, authorization headers, secrets, or unnecessary personal data. Configure `beforeSend`/equivalent scrubbing.
- Set distinct `environment` and `release` (git SHA) values; verify a controlled test exception reaches the intended project.
- CSP violation reports are sent to Sentry (see §11a).
- Do not build a custom offline error queue.

### 7.6 No Crashlytics for the initial web platform

Firebase Crashlytics is not the selected web error tracker. If a native Expo/React Native app is added later, evaluate Crashlytics separately for that app.

## 8. Database

Use PostgreSQL + Drizzle.

- Drizzle schema, connection and migrations live in `packages/database`.
- Use Better Auth's supported schema generation/integration for its tables.
- Keep application tables separate from auth tables; application tables referencing users cascade on user deletion.
- Include migration generation and migration execution scripts.
- Never run destructive schema operations automatically at app startup.
- Use environment variables for connection settings.
- A single PostgreSQL database is sufficient initially.
- Pin the PostgreSQL image to a major version (current stable at implementation time) in Compose. Major-version upgrades are a documented manual dump/restore procedure; Renovate must not bump the major automatically.

### 8.1 Production migrations

See `docs/decisions/0014-database-backups-and-migrations.md`.

- A one-off `migrate` service in `compose.yml`, behind a Compose profile so it never starts by default, runs Drizzle migrations using the API image.
- Documented deploy order: **backup → `docker compose --profile migrate run --rm migrate` → `docker compose pull && docker compose up -d`.**
- Migrations are never run automatically by the API at startup or by CI against production.
- **Backward-compatible migrations (expand/contract)** (`docs/decisions/0019-release-pinning-and-rollback.md`): every migration must leave the schema usable by the *previous* release, so an image rollback never needs a database restore. Add columns/tables as nullable or with defaults; renames and type changes are add-new → backfill → switch code → drop old; destructive steps (drop column/table, tightening constraints) ship in a later release once no running release uses the old shape. A migration that cannot satisfy this is called out in its PR and requires the user's approval.

### 8.2 Backups

- A backup service in `compose.yml` runs a nightly compressed `pg_dump` (using the official PostgreSQL client tooling) into a host directory, with retention (initial default: 7 daily, 4 weekly, 6 monthly).
- Document and test the restore procedure once.
- **Known accepted risk:** no off-site copy initially. Backups live on the same server and do not survive disk loss, theft, fire or host compromise. Revisit before the platform has real users. Any future off-site copy must be encrypted (dumps contain personal data).

## 9. Shared UI

Create `packages/ui` based on HeroUI v3.

- Configure HeroUI and Tailwind once for use by all Next.js apps.
- Export components through a clear package entry point.
- Provide a minimal shared set only where useful: app container/layout primitives, buttons/cards, loading and error presentation, consent banner, app footer (privacy + privacy settings links).
- Establish shared theme tokens and light/dark support if straightforward. Export the tokens as plain CSS so non-React apps (§10a) can match the look.
- UI language is **English only** (`lang="en"`). Keep user-facing strings out of business logic so i18n can be added later; do not add an i18n library now.
- Keep app-specific UI in the app.
- Accessibility baseline: rely on HeroUI's accessible components; semantic HTML, labelled controls, visible focus, sufficient contrast in both themes, keyboard-operable flows (including the consent banner). Checked automatically in e2e (§13.1).
- Do not create pointless wrappers around every HeroUI component.
- Ensure the Next.js apps correctly transpile the workspace UI package.

## 10. Frontend architecture

Use Next.js App Router in all Next.js apps (the default; see §10a for other frameworks).

Recommended feature-oriented structure:

```text
apps/hub/src/
├── app/                    # App Router routes/layouts
├── features/
│   ├── auth/
│   ├── account/            # profile, account deletion
│   ├── legal/              # privacy policy
│   └── applications/       # registry + launcher
├── components/             # App-specific components
├── lib/                    # App-specific utilities
└── proxy.ts                # request proxy (formerly middleware.ts): CSP nonce/security headers

apps/hello/src/
├── app/
├── features/
│   └── auth/
├── components/
└── proxy.ts
```

Guidelines:

- Keep route files thin; move feature logic into `features/`.
- Use Server Components by default.
- Add `"use client"` only when browser interactivity/state is required.
- Keep server-only code out of client bundles (`server-only` where appropriate).
- Keep business logic out of React components.
- Use shared auth/API packages.
- Do not make one app depend on another app's internals.
- Use environment variables for API and app URLs.
- Configure `output: "standalone"` for container builds.
- **Route Handlers / Server Actions:** not allowed as a second business API. Route Handlers are allowed only for infrastructure endpoints: `/healthz` (liveness, `Cache-Control: no-store`, no API/DB dependency) and routes required by official SDKs (e.g. a Sentry tunnel if adopted). See `docs/decisions/0009-route-handlers-infra-only.md`.

## 10a. Other frontend frameworks — integration contract

See `docs/decisions/0018-frontend-framework-contract.md`.

Next.js (via `templates/next-app/`) is the default and should be used unless there is a concrete reason not to (e.g. a single static page where a Node server container is wasteful, or content-heavy pages better served by another tool). Rendering frontend pages from the Fastify API is not allowed.

**Adoption process**

1. The agent proposes the framework with the concrete reason and how it satisfies every rule below; **the user approves** before any code is written. Agents never introduce a framework on their own.
2. The first app of a new framework gets an ADR in `docs/decisions/` and a reusable template `templates/<framework>-app/` (with its own README, placeholders and `create:app --template <framework>` support). Later apps of that framework are generated from that template — never by copying an existing app.
3. The approved-framework list is the set of ADRs plus templates; anything not on it requires steps 1–2.

**Every app, regardless of framework, must:**

| Area | Requirement |
|---|---|
| Workspace | Live in `apps/<slug>`, package `@apps/<slug>`, TypeScript strict, `workspace:*` deps, no imports from other apps |
| Scripts / Turborepo | Provide `dev`, `build`, `lint`, `typecheck`, `test` (and `test:e2e` if applicable) so root commands, caching and CI affected-detection work unchanged |
| Lint / format | Extend the shared ESLint/Prettier config from `packages/config` (framework plugin added there, not ad hoc) |
| Shared packages | Use the framework-neutral cores of `auth-client`, `api-client`, `analytics`, `error-tracking`, CSP builder and access-mode helpers (§3); a framework binding, if needed, is added to the package as a subpath export — not inside the app |
| Business logic | No business API of its own; data and business rules come from the Fastify API. Server endpoints in the app only for infrastructure (§10) |
| Auth | Access modes per route (§5); sign-in via Hub `returnTo`; never store tokens in browser storage. Server-side session checks if the framework has a server runtime; otherwise client-side via `auth-client` (signed-out flash accepted, API still enforces) |
| UI | Use `@platform/ui` components if React; otherwise the shared CSS theme tokens so the app matches visually; shared consent banner/footer behavior (privacy link, privacy settings) |
| Security headers / CSP | Baseline headers and the shared CSP policy: nonce-based if server-rendered; hash-based (no `'unsafe-inline'` scripts) if static |
| Analytics / consent | Through `@platform/analytics`; no SDK before consent; shared consent cookie; own GA4 web stream; `app_id` on events |
| Error tracking | The official Sentry SDK for that framework, own Sentry project, shared scrubbing from `@platform/error-tracking`; source maps from CI |
| Logging | Server runtime (if any) logs via `@platform/logger` to stdout/stderr |
| PWA | Own manifest, icons, service worker and scope; same no-private-caching rules |
| Container | Own Dockerfile using `turbo prune`, own image in GHCR, Compose service with Traefik labels, `/healthz` liveness endpoint (static servers: a static health file/route), bounded log rotation, no new infrastructure services |
| Registry / config | Registered in the Hub registry; trusted origin, Cloudflare Tunnel hostname, dev port + `/etc/hosts` entry, env documentation — same checklist as Next apps |
| Tests | Vitest unit tests; Playwright e2e for its access modes |
| Template CI | Its template is instantiated and built in CI like `templates/next-app/` |

If a framework cannot meet a requirement, stop and ask; do not silently relax it.

## 11. PWA

All frontend apps are independently installable PWAs.

- Each app has its own manifest, name, icons, theme color and start URL.
- Each app has its own service worker and scope.
- Icons: generated placeholder icons (letter on theme color) from one SVG per app, rendered to the required sizes including maskable; replaceable later.
- Provide installability and a basic offline fallback where practical.
- Do not cache authenticated API responses, session endpoints, `/healthz`, or private user data.
- Do not implement push notifications or offline synchronization initially.
- Document HTTPS requirements and how to test PWA behavior (locally via `*.frigi.test` HTTPS).
- Verify compatibility of the selected PWA solution with the current Next.js App Router version and bundler; if incompatible, stop and ask (§2).
- Serwist via `@serwist/turbopack`: `withSerwist` in `next.config.ts`, the service worker source `app/sw.ts`, registration via its React provider, and the SDK-required route handler `app/serwist/[path]/route.ts` (allowed under the infrastructure-only Route Handler rule). Exclude `/serwist/*` from the request proxy matcher where required and from caching; add `worker-src 'self'` to the CSP. Spike it in Hello first; if it fails, stop and ask before switching to webpack builds.

## 11a. Security headers and CSP

See `docs/decisions/0011-security-headers-csp.md`.

- Baseline headers on every Next.js app: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`, `frame-ancestors 'none'`. HSTS is set at the edge (Cloudflare/Traefik).
- Strict nonce-based CSP generated per request in each app's request proxy file (`proxy.ts` in current Next.js; `middleware.ts` in older versions — use what the installed version documents) (`script-src 'self' 'nonce-…' 'strict-dynamic'`; `connect-src` limited to the API origin, Sentry ingest and Firebase/GA endpoints; `object-src 'none'`; `base-uri 'self'`).
- The nonce CSP applies to every page, including `public` ones; public pages are therefore rendered dynamically. This is accepted (no edge HTML caching is used anyway). Do not add a static-CSP opt-out for Next.js pages without approval.
- A shared, typed CSP builder (allowlists derived from env URLs) lives in a shared package; apps call it rather than hand-writing policies. It supports nonce mode (server-rendered) and hash mode (static apps under §10a).
- Roll out as `Content-Security-Policy-Report-Only` with reports to Sentry; switch to enforcing once reports are clean (tracked as an explicit task).
- API security headers via Fastify (helmet or equivalent).

## 12. Deployment

See `docs/decisions/0002-edge-cloudflare-tunnel-and-infra-stack.md` and `docs/decisions/0003-ci-ghcr-deploy.md`.

### 12.1 Topology

```text
Browser ──HTTPS──▶ Cloudflare edge ──Tunnel──▶ cloudflared ──HTTP──▶ Traefik (web :80) ──▶ hub / hello / api containers
                                                                                         (traefik_net)
Admin (LAN/WireGuard) ──▶ Portainer, Traefik dashboard, SSH  (bound to ADMIN_BIND_IP only)
```

- Production server: home server, linux/amd64.
- **Two Compose projects:**
  - `infra/compose.yml` — Traefik v3 (owns the `traefik_net` bridge network), `cloudflared` (token-based Cloudflare Tunnel, public hostnames configured in the Cloudflare Zero Trust dashboard, forwarding to `http://traefik:80`), Portainer CE. Redeploying apps never touches infra.
  - `compose.yml` (root) — Hub, Hello, API, PostgreSQL, backup service, profile-gated `migrate`. App services join `traefik_net` as an external network and route via Traefik labels (`Host(...)`, entrypoint `web`). PostgreSQL is only on an internal network.
- Target: no inbound router port forwarding for 80/443 (Cloudflare Tunnel). The setup guide includes checking the current Cloudflare mode and migrating.
- Infra hardening (vs. the current hand-written Traefik config): dashboard bound to `ADMIN_BIND_IP` only (not `0.0.0.0:8080`); drop the obsolete Compose `version` key; bounded log rotation; optional read-only Docker socket proxy for Traefik (recorded as a future hardening option).
- Cloudflare: never cache `api.frigi.me` or HTML/session responses; disable Rocket Loader, Email Obfuscation and other HTML-rewriting features for platform hostnames.

### 12.2 Images, CI and rollout

- Separate production Dockerfiles for every deployable (Hub, Hello, API, future apps) using `turbo prune <app> --docker`; Next apps use standalone output; apps of other approved frameworks follow their template's Dockerfile.
- GitHub Actions:
  - On pull requests: lint, typecheck, unit tests, e2e, builds — **without secrets** (fork PRs). Never use `pull_request_target` to build untrusted code.
  - On `main`: detect affected deployables (`turbo` affected detection), build only those images in a matrix, upload Sentry source maps, push to GHCR tagged with git SHA and `latest`.
  - Manual `workflow_dispatch` to rebuild a single app.
  - A CI check instantiates each template in `templates/` into a temporary app and runs typecheck/lint/build to keep the templates working.
- `NEXT_PUBLIC_*` values are baked in at image build time (single production environment); server secrets are runtime-only (server `.env`), never build args.
- **Pinned image tags** (`docs/decisions/0019-release-pinning-and-rollback.md`): the root `compose.yml` references images as `ghcr.io/…-<app>:${<APP>_IMAGE_TAG}` (e.g. `HUB_IMAGE_TAG`, `HELLO_IMAGE_TAG`, `API_IMAGE_TAG`); the server `.env` pins each to a git-SHA tag. `latest` is a convenience tag only and is never used by the production stack. The migrate service uses the API tag.
- Rollout is manual: on the server, set the new SHA tag(s) in `.env`, then backup → migrate (if the release includes migrations) → `docker compose pull && docker compose up -d`. Record the previous tags (a short deploy log in a comment or `deploy.log` on the server) so rollback is one edit. No CI-initiated deploys, no auto-updaters.
- **Rollback:** set the previous SHA tag(s) and `docker compose up -d`. Migrations are not rolled back (they are backward-compatible, §8.1). Restoring the pre-deploy backup is the last resort for data corruption only, and loses data written since the backup.
- Public repository hygiene: enable GitHub secret scanning and push protection; images contain only public config.

### 12.3 Requirements

- Persist PostgreSQL data in a Docker volume; do not expose PostgreSQL publicly.
- Health checks: API `GET /health`; Next apps `GET /healthz` (via a small `node` fetch, since standalone images lack curl); PostgreSQL `pg_isready`.
- Configure bounded Docker `local` log rotation for all containers.
- Do not commit secrets or production `.env` files.
- Document reverse-proxy routing, Cloudflare Tunnel, hostnames, and environment configuration.

### 12.4 Monitoring and alerting

See `docs/decisions/0021-uptime-monitoring-and-alerts.md`.

- **External uptime checks:** a free external uptime-monitoring service (chosen during setup, user's account) checks `https://hub.frigi.me/healthz`, `https://hello.frigi.me/healthz` (and each future app) and `https://api.frigi.me/health` every few minutes and notifies the user by email. It runs outside the home server, so it also detects server, power, network and tunnel outages.
- **Sentry alert rules:** each Sentry project emails the user on new and regressed issues; keep defaults conservative to avoid noise.
- Health endpoints stay unauthenticated, cheap and free of personal data; they are excluded from analytics and never cached.
- No self-hosted monitoring stack (consistent with §7). Adding an app adds its `/healthz` to the uptime checker (template checklist).

## 13. Developer experience

Provide root scripts, including equivalents of:

- `pnpm dev` — run Hub, Hello and API natively in development (PostgreSQL via `docker compose -f compose.dev.yml up -d` or equivalent).
- `pnpm dev:hub`
- `pnpm dev:hello`
- `pnpm dev:api`
- `pnpm build`
- `pnpm lint`
- `pnpm format` / `pnpm format:check`
- `pnpm typecheck`
- `pnpm test` (unit) and `pnpm test:e2e`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm create:app`

Use Turborepo task dependencies and caching sensibly (no remote cache initially). Commands must work from a clean checkout after following the README.

### 13.1 E2E authentication

See `docs/decisions/0007-e2e-auth-session-seeding.md`.

- Playwright global setup seeds a test user and session directly in the e2e PostgreSQL database (through `packages/database`) and sets the corresponding session cookie in the browser context, using Better Auth's documented cookie format/test utilities for the installed version.
- No test-only sign-in endpoint or auth bypass exists in application code.
- E2E covers: Hub shows profile; Hello recognizes the same session; Hello renders for signed-out visitors (`optional`); an `authenticated` route redirects to Hub sign-in with `returnTo`; `/api/me` 200 vs 401; an API route without an explicit access declaration rejects anonymous calls; sign-out reflected in both apps; Google sign-in redirect URL/parameters (without completing Google login).
- An automated accessibility check (axe via Playwright) runs on the main pages of Hub and Hello; violations of serious/critical rules fail the test.
- A real Google sign-in is a documented manual verification step per environment.

### 13.2 Git workflow

See `docs/decisions/0020-git-workflow-branch-protection.md`.

- `main` is protected: no direct pushes, no force-pushes, no deletion. Changes go through short-lived branches and pull requests.
- Required status checks before merge: lint, format check, typecheck, unit tests, e2e and build (the PR workflow jobs). Branch must be up to date with `main`. The owner may self-merge (no required human review on a solo repo).
- Prefer squash merges with a descriptive title; branch names like `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Agents always work on a branch and open a PR (or leave the branch for the user) — never commit to `main` directly, and only commit/push/open PRs when the user asks.
- Image builds and pushes to GHCR run only on `main` after merge, so only code that passed the required checks becomes a deployable image. Renovate PRs go through the same checks.

## 14. Canonical application template

`templates/next-app/` is the source of truth for future independent Next.js applications (the default). Templates for other approved frameworks follow §10a and the same generator flow.

It must be a working, minimal app template, not just an empty folder structure. It should include:

- Next.js App Router foundation with standalone output.
- Shared UI package integration (including consent banner and footer).
- Shared auth client integration with example routes for all three access modes (`public`, `optional`, `authenticated`) using the shared session helpers.
- Shared API client integration.
- Feature-oriented folder convention.
- Root layout and providers.
- Loading, error, global-error and not-found conventions.
- Request proxy file (`proxy.ts`) with CSP nonce and baseline security headers.
- `/healthz` liveness Route Handler.
- Sentry per-app setup files; analytics wiring behind consent.
- PWA manifest/service-worker integration and placeholder icon source.
- Dockerfile (or a documented shared Dockerfile pattern) and Compose/Traefik label snippet.
- Environment variable example.
- Package scripts and workspace dependencies.
- A README explaining placeholders and how to instantiate the template.

Placeholders: `__APP_SLUG__` (URL-safe id, used for package name `@apps/__APP_SLUG__`, hostname and registry id), `__APP_DISPLAY_NAME__`, `__APP_DESCRIPTION__`. Use them only where the generator or documented copy-and-replace can reliably replace them. (The current template files still use `__APP_NAME__`; align during implementation step 7.)

`pnpm create:app --slug <slug> --name "<Display Name>" --description "<text>" [--access public|optional|authenticated] [--template next]` must (`--template` defaults to `next`; other values only for approved framework templates):

1. Validate the slug (lowercase, URL-safe, not colliding with existing apps/packages/reserved names).
2. Copy the template to `apps/<slug>`.
3. Replace placeholders and package name; fail if any `__APP_` token remains.
4. Rely on pnpm workspace globbing for workspace inclusion.
5. Assign the next free dev port and print the `/etc/hosts` line, env variables and deployment hostname to add.
6. Register the app in Hub's application registry.
7. Print the remaining manual steps (Compose service + Traefik labels, Cloudflare Tunnel hostname, trusted origins, Firebase web app, Sentry project, CI matrix if not automatic).
8. Run install, typecheck, lint and build.

Do not make runtime plugin loading part of this template. Apps are independently deployed frontends, not dynamically loaded plugins.

## 15. Hub application registry

Keep the initial registry simple and typed.

- Hub lists enabled apps from a small typed registry in the Hub (or a shared package if reuse is justified).
- Initially it contains only Hello.
- App metadata includes a stable id (= slug), display name, description, URL (from environment, e.g. per-app public URL variable), `access` (`public` | `optional` | `authenticated`, describing the app's entry point) and optional icon key.
- The launcher shows every enabled app to signed-in users; signed-out visitors see `public` and `optional` apps normally and `authenticated` apps marked as requiring sign-in (linking to sign-in with `returnTo`).
- Avoid arbitrary remote script loading or executable plugin code.
- Adding an app requires rebuilding the Hub image (URLs are baked at build time).
- Document how a newly generated app is registered.

If the registry is a shared package, keep it free of server secrets and environment-specific assumptions.

## 16. Explicitly out of scope

Do not implement initially:

- Additional business apps.
- Runtime plugin marketplace/dynamic plugin loading.
- Microservices.
- WebSockets.
- Push notifications.
- Background job queues.
- Complex roles/permissions.
- Billing or multi-tenancy.
- Admin panel / user administration (account self-deletion is in scope; administration of other users is not).
- Self-service data export (handled manually on request).
- Off-site backups (accepted risk, §8.2).
- i18n.
- Anonymous/guest users with persisted data.
- Templates for non-Next frameworks (created only when the first such app is approved, §10a).
- Turborepo remote cache.
- Complex offline synchronization.
- Native Expo apps.

Keep extension points sensible but do not build speculative functionality.

## 17. Acceptance criteria

The project is complete when:

1. A clean checkout installs with pnpm (pinned Node 24 / pnpm versions).
2. Hub, Hello and API run independently in development on `*.frigi.test` with HTTPS.
3. Hub offers Google sign-in.
4. OAuth completes with configured Google credentials (verified manually).
5. Hub displays the signed-in user's public profile.
6. Hub links to the independent Hello frontend.
7. Hello displays `Hello, world!`.
8. Hello recognizes the Hub-created session without another login; sign-in started from Hello returns to Hello.
9. Sign-out invalidates the session and both apps reflect it on their next session check.
10. Protected API endpoints reject unauthenticated requests.
11. A user can delete their own account; their sessions and data are removed.
12. PostgreSQL schema can be created with documented migrations; production migrations run only via the explicit migrate step.
13. All frontends build independently and have PWA configuration.
14. Docker Compose can run the app stack; `infra/` runs Traefik, cloudflared and Portainer as a separate project.
15. A new app can be generated with `pnpm create:app` and registered in Hub using documented steps; CI verifies the template builds.
16. README and `docs/setup-guide.md` explain local setup, OAuth, Firebase Analytics, consent, Sentry, Cloudflare Tunnel, Docker/Portainer, backups, deployment and manual cloud-console steps.
17. Each app and the API run in their own Docker container; Portainer (reachable only via LAN/WireGuard) displays their status and logs.
18. Pino logs are structured JSON and Docker log rotation is configured.
19. Firebase Analytics is not loaded before consent, is initialized only in the browser, and consent can be withdrawn from any app.
20. Sentry receives controlled test errors from browser, Next.js server and API runtimes, with source maps configured and secrets kept server-side.
21. CSP is deployed in Report-Only mode with reports reaching Sentry; baseline security headers are present.
22. Nightly backups are produced with retention, and a restore has been tested once.
23. CI builds only affected app images and pushes them to GHCR; PR workflows run without secrets.
24. Privacy policy page exists and is linked from every app.
25. Access modes work end to end: public and optional routes render signed out, authenticated routes redirect to Hub sign-in, and API routes default to `auth: "required"`.
26. Frontend-facing shared packages expose framework-neutral cores with framework bindings as subpath exports; UI theme tokens are available as plain CSS.
27. Production Compose uses pinned SHA image tags; the rollback procedure is documented and has been exercised once.
28. API errors use the shared error envelope with stable codes and `requestId`; the API client exposes them as typed errors.
29. `main` is protected with required CI checks; external uptime checks and Sentry alert rules notify the user.
30. Sessions last 30 days (sliding) and revocation takes effect immediately.

## 18. Implementation order

1. Verify current official docs and package compatibility (stop and ask on conflicts).
2. Create monorepo, pnpm, Turborepo, shared config (TS/ESLint/Prettier), Lefthook, Renovate.
3. Create database package and migrations.
4. Implement Fastify and Better Auth (incl. rate limiting, account deletion, trusted origins).
5. Implement shared auth and API client packages.
6. Implement shared UI package.
7. Implement the canonical `templates/next-app/` and the `create:app` generator.
8. Instantiate Hub and Hello from the template.
9. Verify cross-subdomain sessions locally on `*.frigi.test`.
10. Add PWA support.
11. Add security headers and Report-Only CSP.
12. Add Docker images, root Compose stack (incl. backup and migrate), `infra/` stack and bounded log rotation.
13. Add Pino logging, consent + Firebase Analytics and Sentry integrations with safe defaults.
14. Add CI workflows (PR checks, affected image builds, template check).
15. Draft privacy policy from the implemented data flows.
16. Write and verify the setup guide, including local and cloud-console configuration steps and optional MCP setup.
17. Run lint, typecheck, tests and production builds.

Do not stop after generating boilerplate. Run checks and fix errors. If a library's current behavior conflicts with this document, stop and ask, then document the outcome and preserve the intended architecture.

At completion, report the repository structure, exact run commands, required environment variables, OAuth setup, remaining manual steps, and results of all checks.

## 19. External setup and agent handoff

`docs/setup-guide.md` is a required deliverable, not optional prose. It must be maintained alongside the implementation and contain a concrete, checked setup inventory for: local development prerequisites; local hostnames/HTTPS; Docker/Compose and Portainer; Cloudflare DNS and Tunnel; Google Cloud OAuth clients and consent screen; Firebase project, GA4 property and per-app web streams; consent configuration; Sentry organization/projects, DSNs, auth token and source-map upload; GitHub repository, Actions and GHCR; production environment variables; Traefik host routing; backups and restore; and verification steps.

At the end of implementation, Claude Code must provide a concise setup report with: (1) completed automatically, (2) actions the user must perform in local tools, (3) actions the user must perform in cloud consoles, (4) exact values/URLs to copy into environment variables or console fields, (5) secrets that must be entered locally and never pasted into chat or committed, (6) verification commands and expected results, and (7) unresolved blockers. Never claim a cloud resource or integration is configured unless it was actually verified. Ask before creating billable resources, changing access/security settings, or deploying publicly.

## 20. Accepted risks

- No off-site database backups (§8.2).
- Docker logs are bounded and not durable (§7.2).
- Sentry free-plan error quota is shared across projects (§7.5).
- Privacy policy is a technical draft pending the user's legal review (§7.4).
