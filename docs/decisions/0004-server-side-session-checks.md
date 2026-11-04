# 0004. Server-side session checks in Next.js via internal API URL

- Status: Accepted (amended by 0017)
- Date: 2026-11-03

## Context
The `HttpOnly` session cookie is issued by the API on `frigi.me`. Client-only session checks cause a signed-out flash and prevent server redirects; the spec prefers Server Components.

## Decision
Server Components call the API's Better Auth session endpoint over the internal Docker network (`API_INTERNAL_URL`, e.g. `http://api:4000`), forwarding only the incoming cookie header, never logging it. Client components use the shared auth-client hook for interactive updates. The API re-validates the session for every protected endpoint.

## Alternatives considered
- Client-only `useSession()`: simpler, but loading flash and no server redirects.

## Consequences
- Session-dependent pages are dynamically rendered (also required by the nonce CSP, 0011).
- Next servers handle the cookie transiently; logging/redaction rules apply.
- One extra internal request per render; acceptable at this scale.
