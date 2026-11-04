# 0007. E2E auth by seeding sessions in the test DB

- Status: Accepted
- Date: 2026-11-03

## Context
Playwright cannot reliably complete Google login (bot detection, 2FA, credentials in CI). The key acceptance criteria are auth flows.

## Decision
Playwright global setup inserts a test user and session into the e2e database via `packages/database` and sets the matching session cookie (Better Auth's documented format/test utilities). No test-only endpoint or bypass in application code. E2E asserts the Google redirect URL/parameters without completing Google login. Real Google sign-in is a manual verification step per environment.

## Alternatives considered
- Env-flagged test sign-in endpoint: an auth bypass living in production code.
- Mock OIDC provider: more infrastructure, still differs from production config.
- Manual only: leaves cross-app session flows untested.

## Consequences
- Test harness depends on Better Auth's cookie/session format; re-verify on Better Auth upgrades.
