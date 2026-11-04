# 0015. Open sign-up with user-data safeguards and self-service deletion

- Status: Accepted
- Date: 2026-11-03

## Context
The platform may be used by people other than the owner. Any Google account can register.

## Decision
- No allowlist; any Google account may sign up.
- All data access is scoped to the session user id; never trust browser-supplied ids.
- Better Auth rate limiting with persistent (database) storage.
- Self-service account deletion on the Hub (Better Auth user deletion, confirmation step); app tables cascade on user deletion. Data export manually on request.
- Privacy policy drafted from the implementation; controller details are user-filled placeholders; consent screen published in Google once the policy is live.

## Alternatives considered
- Env or DB allowlist; disable sign-up after bootstrap.

## Consequences
- GDPR controller obligations apply to the owner.
- Future apps must be multi-user safe from day one.
