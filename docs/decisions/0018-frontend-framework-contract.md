# 0018. Other frontend frameworks allowed via an integration contract

- Status: Accepted
- Date: 2026-11-04

## Context
Some future apps may be a single page, where a Next.js Node server container (~one per app) is heavier than needed, or may suit another tool better. The owner wants the option to use another framework without fragmenting the monorepo workflow.

## Decision
- Next.js stays the default. Another framework is allowed only through the integration contract in `project-spec.md` §10a.
- Adoption requires: an agent proposal with a concrete reason, explicit user approval, an ADR, and a reusable `templates/<framework>-app/` created with the first app (supported by `create:app --template`). Later apps of that framework come from the template.
- Every app, regardless of framework, satisfies the same contract: workspace/package naming, standard scripts for Turborepo/CI, shared lint config, shared framework-neutral packages, no own business API, access modes and Hub sign-in, CSP (nonce or hash; no `'unsafe-inline'` scripts), consent-gated analytics, its own Sentry project, stdout logging, PWA rules, own container with `/healthz`, Hub registration, tests, and template CI.
- To make this possible, frontend-facing shared packages expose framework-neutral cores with framework bindings as subpath exports, and `@platform/ui` exports theme tokens as plain CSS.
- Rendering frontend pages from the Fastify API is not allowed.

## Alternatives considered
- Next.js only (with a static-export variant later): simplest, but no flexibility.
- Free choice per app: fragments tooling, security and observability.
- Group tiny tools into one Next app: loses app independence.

## Consequences
- Slightly more structure in shared packages from day one (core + bindings).
- The first non-Next app costs extra: ADR, template, SDK integrations for that framework.
- If a framework cannot meet a contract item, the agent stops and asks.
