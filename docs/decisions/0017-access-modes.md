# 0017. Per-route access modes; API defaults to `auth: "required"`

- Status: Accepted
- Date: 2026-11-04
- Amends: 0004 (session lookups only for `optional`/`authenticated` routes)

## Context
Not every page needs sign-in: some apps are fully public, some mix public and signed-in features. The earlier spec implicitly treated everything as session-aware.

## Decision
- Every frontend and API route declares an access mode:
  - `public` — no session lookup; API `auth: "none"`.
  - `optional` — session lookup without redirect; API handler gets `user | null`.
  - `authenticated` — redirect to Hub sign-in with `returnTo`; API returns 401.
- API default is `auth: "required"`, enforced centrally (route option + hook); public/optional must be explicit, rate-limited and anonymous-safe.
- Shared helpers (framework-neutral core + Next binding), e.g. `getOptionalSession()`/`requireSession()`.
- Hub registry gets an `access` field; the launcher shows public/optional apps to signed-out visitors and marks authenticated ones.
- Nonce CSP stays on every page, including public ones (pages render dynamically).

## Alternatives considered
- Static-CSP opt-out for fully static public pages: faster/cacheable, but weaker policy and a second CSP path.
- API default `none`: forgetting a declaration would expose data.

## Consequences
- Template ships examples of all three modes.
- Anonymous users with persisted data remain out of scope.
