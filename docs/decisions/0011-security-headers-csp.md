# 0011. Nonce-based CSP, Report-Only first

- Status: Accepted
- Date: 2026-11-03

## Context
Open sign-up means user-generated content will eventually appear; CSP is the main XSS mitigation. Next.js inline bootstrap scripts make a static CSP require `'unsafe-inline'`.

## Decision
- Baseline headers in every app (`nosniff`, strict referrer policy, restrictive `Permissions-Policy`, `frame-ancestors 'none'`); HSTS at the edge.
- Per-request nonce CSP (`'nonce-…' 'strict-dynamic'`) from each app's request proxy file (`proxy.ts` in current Next.js), built by a shared typed CSP builder from env URLs (API, Sentry ingest, Firebase/GA).
- Ship as Report-Only with reports to Sentry; enforce once clean.

## Alternatives considered
- Static allowlist CSP: works with static pages but needs `'unsafe-inline'`.
- No CSP.

## Consequences
- Pages are dynamically rendered (already true due to 0004).
- Switching to enforcing is an explicit follow-up task.
