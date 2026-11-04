# 0006. Central Hub sign-in with validated `returnTo`

- Status: Accepted
- Date: 2026-11-03

## Context
Signed-out users in an app need to sign in and come back. Open sign-up makes a single, consistent sign-in page (with privacy link) desirable. Return URLs are an open-redirect risk.

## Decision
Apps link to `https://hub.frigi.me/sign-in?returnTo=<absolute app URL>`. The Hub accepts only absolute `https` URLs whose origin is in the trusted-origins list (otherwise falls back to Hub home), then starts Google sign-in with `callbackURL=returnTo`. Better Auth validates `callbackURL` against `trustedOrigins` again. Sign-out can happen from any app.

## Alternatives considered
- Each app triggers sign-in directly: spreads sign-in UX across apps.
- Always land on Hub: poor UX.

## Consequences
- The trusted-origins list is security-relevant and must be updated when an app is added.
