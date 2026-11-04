# 0023. 30-day sliding sessions, no cookie cache

- Status: Accepted
- Date: 2026-11-04

## Context
Better Auth defaults to 7-day sessions. The platform is a set of personal PWAs where frequent re-sign-in is friction; sign-out and account deletion must still take effect immediately across all apps.

## Decision
- `session.expiresIn` = 30 days, `session.updateAge` = 1 day (sliding while used).
- Better Auth's session cookie cache stays disabled, so every session check hits the database and revocation is immediate.

## Alternatives considered
- 7 days (default): more re-sign-ins.
- 90 days: longer exposure if a device is lost.
- Cookie cache on: fewer DB reads, but revocation delayed up to the cache TTL.

## Consequences
- One session lookup per server-side check; acceptable at this scale.
