# 0013. Just-in-time TS packages, bundled API

- Status: Accepted
- Date: 2026-11-03

## Context
Shared packages are consumed by Next.js apps (can compile workspace TS) and by the Fastify API (plain Node in production).

## Decision
- Packages export TypeScript source via `exports` (no per-package build).
- Next.js apps use `transpilePackages`.
- API: `tsx watch` in development; production bundle with tsdown, with native/optional dependencies (`pg`, Pino transports, etc.) marked external and installed in the image.

## Alternatives considered
- Compiled packages (`dist/` + `.d.ts`): conventional, but build/watch steps everywhere.
- Node native type stripping: no bundler, but erasable-syntax-only constraints and `.ts` import extensions everywhere.

## Consequences
- Packages are not publishable to npm as-is (not needed).
- Bundler externals must be maintained when adding native dependencies.
