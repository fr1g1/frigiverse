# 0003. GitHub Actions affected-only image builds to GHCR, manual deploy

- Status: Accepted (amended by [0019](0019-release-pinning-and-rollback.md): pinned SHA tags, expand/contract migrations, rollback)
- Date: 2026-11-03

## Context
Building Next.js monorepo images on a home server is slow and resource-heavy. The repository is public on GitHub. There is a single production environment.

## Decision
- GitHub Actions detects affected deployables via Turborepo and builds only those images (matrix; `turbo prune <app> --docker`), pushes to GHCR tagged with git SHA and `latest`, uploads Sentry source maps. Manual `workflow_dispatch` rebuild per app.
- `NEXT_PUBLIC_*` baked in at build time; server secrets only at runtime from the server `.env`.
- PR workflows run without secrets; `pull_request_target` is never used to build untrusted code. Secret scanning + push protection enabled.
- Deploys are manual on the server: backup → migrate (if needed) → `docker compose pull && docker compose up -d`.
- No Turborepo remote cache initially.

## Alternatives considered
- Build on the server: no registry, but slow and resource-heavy.
- Runtime injection of public config: build-once portability not needed with one environment.
- CI-initiated SSH deploys / auto-updaters: less control, needs inbound access.

## Consequences
- Adding an app requires CI to know it (affected detection should discover apps automatically).
- Images are environment-specific; a public-config change requires a rebuild.
