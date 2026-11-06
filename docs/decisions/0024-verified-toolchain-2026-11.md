# 0024. Verified toolchain and library versions (2026-11)

- Status: Accepted
- Date: 2026-11-06

## Context
Implementation step 1 (spec §18) checked the planned stack against npm metadata and current official documentation. Several newest releases are not yet mutually compatible.

## Decision
| Area | Pin | Reason |
|---|---|---|
| TypeScript | 6.0.x (6.0.3) | TS 7 (native) has no compiler API; typescript-eslint (also used by `eslint-config-next`) supports `<6.1`. tsconfigs are written TS 7-ready: no `baseUrl`, `module: esnext` + `moduleResolution: bundler`, explicit `types`. |
| ESLint | 9.x (9.39.x) | `eslint-config-next` 16 bundles react/import/jsx-a11y plugins capped at ESLint 9 and crashes on 10 (Next issue #89764). |
| pnpm | 11.x (11.28.x) | Turborepo ≥ 2.11.7 parses/prunes pnpm 11's multi-document lockfile; pnpm 12 support is unconfirmed. Settings live in `pnpm-workspace.yaml`; build scripts approved via `allowBuilds` (e.g. Lefthook). |
| Node.js | 24 LTS via `.node-version`; developers use fnm | Corepack is experimental in Node 24 and removed in 25; Fedora's `nodejs24` lags security releases. |
| PWA | `@serwist/turbopack` | Next 16 builds with Turbopack by default; `@serwist/next` is webpack-only. Uses an SDK-required route handler `app/serwist/[path]/route.ts`. Spike in Hello first; fallback (webpack builds) only after asking. |
| Account deletion | Re-sign-in with Google when the session is not fresh, then typed confirmation | Better Auth requires a fresh session (default 1 day) or email verification for social-only accounts; 30-day sessions are rarely fresh. No email infrastructure. |

Other verified versions at decision time: Next 16.4, React 19.3, HeroUI 3.2, Tailwind 4.3, Better Auth 1.7 (Drizzle adapter package `@better-auth/drizzle-adapter`, CLI `npx auth generate`), Drizzle ORM 0.45 stable (not 1.0 rc), drizzle-kit 0.31, Fastify 5.12, `@sentry/nextjs`/`@sentry/node` 11, Turborepo 2.11, Vitest 5, Playwright 1.65, tsdown 0.23, Lefthook 2. Exact versions live in the pnpm catalog; Renovate keeps the majors above held until their blockers are resolved.

Caveats to resolve during implementation (spikes, not decisions):
- Sentry's Fastify integration docs list only Fastify 3/4; v5 support is in the SDK code but must be verified.
- HeroUI v3 needs a `csp-nonce` meta tag; inline `style` attributes must be tested against the strict CSP.
- Firebase Analytics injects gtag.js; CSP needs explicit Google hosts and `'strict-dynamic'` behaviour verified in a browser.
- Better Auth rate limiting needs the `rateLimit` table and correct client-IP headers behind Cloudflare → Traefik.
- Server-side session fetches drop refreshed Set-Cookie headers; refresh happens via the client hook (or `session.deferSessionRefresh`, to be evaluated).
- E2E sessions via Better Auth's official `testUtils` plugin in a test-only auth instance (no routes, no app bypass).
- Playwright does not officially support Fedora; authoritative e2e runs on Ubuntu CI.

## Alternatives considered
- TS 7 with TS 6 side by side for linting; TS 7 without type-aware lint.
- ESLint 10 without `eslint-config-next`.
- pnpm 12 (unconfirmed turbo support) or staying on pnpm 10 (old config model).
- `@serwist/next` with `next build --webpack`; a hand-written service worker.
- Email confirmation for deletion; `freshAge: 0`.

## Consequences
- Renovate must hold TypeScript 7, ESLint 10 and pnpm 12 until upstream support lands; re-check at each Renovate dashboard review.
