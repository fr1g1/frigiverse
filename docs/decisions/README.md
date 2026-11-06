# Architecture decision records

Short records of non-obvious decisions: context, decision, consequences. One file per decision, numbered sequentially. Do not rewrite an accepted record to change its outcome — add a new record that supersedes it and update the old record's status.

Template:

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Alternatives considered
## Consequences
```

| # | Decision | Status |
|---|---|---|
| [0001](0001-cookie-domain-and-hostnames.md) | Hostnames under `frigi.me`, session cookie scoped to `frigi.me` | Accepted |
| [0002](0002-edge-cloudflare-tunnel-and-infra-stack.md) | Cloudflare Tunnel + existing Traefik; separate `infra/` Compose project | Accepted |
| [0003](0003-ci-ghcr-deploy.md) | GitHub Actions affected-only image builds to GHCR, manual deploy | Accepted (amended by 0019) |
| [0004](0004-server-side-session-checks.md) | Server-side session checks in Next.js via internal API URL | Accepted (amended by 0017) |
| [0005](0005-local-development.md) | Native local dev on `*.frigi.test` with mkcert HTTPS | Accepted |
| [0006](0006-hub-sign-in-return-flow.md) | Central Hub sign-in with validated `returnTo` | Accepted |
| [0007](0007-e2e-auth-session-seeding.md) | E2E auth by seeding sessions in the test DB | Accepted |
| [0008](0008-error-tracking-scope.md) | Sentry for Next.js apps and the Fastify API, project per deployable | Accepted |
| [0009](0009-route-handlers-infra-only.md) | Route Handlers only for infrastructure endpoints | Accepted |
| [0010](0010-analytics-consent.md) | Analytics: one GA4 property, stream per app, no SDK before consent | Accepted |
| [0011](0011-security-headers-csp.md) | Nonce-based CSP, Report-Only first | Accepted |
| [0012](0012-naming-and-scopes.md) | `hello` app, `@apps/*` vs `@platform/*` scopes, English UI | Accepted |
| [0013](0013-jit-packages-bundled-api.md) | Just-in-time TS packages, bundled API | Accepted |
| [0014](0014-database-backups-and-migrations.md) | Local nightly backups, manual profile-gated migrations | Accepted (amended by 0019) |
| [0015](0015-open-signup.md) | Open sign-up with user-data safeguards and self-service deletion | Accepted |
| [0016](0016-tooling-baseline.md) | Node 24, ESLint+Prettier, Lefthook, Renovate, MIT | Accepted (amended by 0024) |
| [0017](0017-access-modes.md) | Per-route access modes; API defaults to `auth: "required"` | Accepted |
| [0018](0018-frontend-framework-contract.md) | Other frontend frameworks via an integration contract | Accepted |
| [0019](0019-release-pinning-and-rollback.md) | Pinned SHA image tags, expand/contract migrations, tag-based rollback | Accepted |
| [0020](0020-git-workflow-branch-protection.md) | Protected `main`, PRs with required checks | Accepted |
| [0021](0021-uptime-monitoring-and-alerts.md) | External uptime checks and Sentry alert rules | Accepted |
| [0022](0022-api-error-envelope.md) | API error envelope with stable codes | Accepted |
| [0023](0023-session-lifetime.md) | 30-day sliding sessions, no cookie cache | Accepted |
| [0024](0024-verified-toolchain-2026-11.md) | Verified toolchain pins (TS 6, ESLint 9, pnpm 11, @serwist/turbopack, re-auth before deletion) | Accepted |
