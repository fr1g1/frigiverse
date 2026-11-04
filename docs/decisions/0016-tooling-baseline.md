# 0016. Node 24, ESLint+Prettier, Lefthook, Renovate, MIT

- Status: Accepted
- Date: 2026-11-03

## Decision
- Node.js 24 LTS pinned via `.nvmrc`, `engines` and Docker base images; pnpm pinned via `packageManager`; pnpm catalogs for shared versions.
- ESLint (flat config, `eslint-config-next`, typescript-eslint) + Prettier, shared in `packages/config`.
- Lefthook pre-commit: format + lint on staged files.
- Renovate for dependency updates (grouped, catalog-aware).
- MIT license; public GitHub repository; default branch `main`.
- Generated placeholder PWA icons until real artwork exists.
- If a chosen library proves unstable/incompatible during verification, stop and ask; record the outcome here as a new ADR.

## Alternatives considered
- Node 26 LTS (newer, slightly fresher ecosystem risk); Biome; Husky; Dependabot; AGPL-3.0.
