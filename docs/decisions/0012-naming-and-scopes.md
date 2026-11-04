# 0012. `hello` app, `@apps/*` vs `@platform/*` scopes, English UI

- Status: Accepted
- Date: 2026-11-03

## Context
An app named `test` collides with `pnpm test`, the Turborepo `test` task, `test.frigi.test` and staging-like naming. A single `@platform/*` scope lets an app name clash with a package.

## Decision
- The demo app is `hello` (`apps/hello`, `@apps/hello`, `hello.frigi.me`).
- Deployable apps use `@apps/<slug>`; shared packages use `@platform/<name>`. The generator rejects colliding/reserved slugs.
- UI is English only; no i18n library for now.

## Consequences
- Template placeholders move to `__APP_SLUG__`, `__APP_DISPLAY_NAME__`, `__APP_DESCRIPTION__`.
