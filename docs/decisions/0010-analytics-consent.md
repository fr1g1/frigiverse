# 0010. Analytics: one GA4 property, stream per app, no SDK before consent

- Status: Accepted
- Date: 2026-11-03

## Context
The owner is in the EU (GDPR/ePrivacy). GA4 sets device identifiers and requires prior opt-in consent. Apps share the `frigi.me` parent domain and one controller.

## Decision
- One Firebase project, one GA4 property, one web data stream per Next.js app; every event has `app_id` (custom dimension). Reports can be combined or split by stream/app.
- No Firebase SDK is loaded before consent (no Consent Mode "advanced" pings).
- Custom banner in `@platform/ui`, state in `@platform/analytics`; "Accept" and "Reject" equally prominent; "Privacy settings" in every footer.
- Consent stored in one shared, versioned, non-HttpOnly cookie on the platform cookie domain; withdrawal anywhere applies everywhere and deletes `_ga*` cookies.
- Analytics disabled in development. Privacy policy at `hub.frigi.me/privacy`.

## Alternatives considered
- Separate GA4 property per app: full isolation, no cross-app journeys, more configuration.
- `vanilla-cookieconsent` library or hosted CMP: more than one purpose needs; hosted CMP adds a third-party script.
- Per-app consent: repeated prompts without benefit.

## Consequences
- Lower analytics coverage (only consenting users) — accepted.
- Consent version must be bumped when purposes change.
