# Next.js application template

This directory is the canonical starting point for new independent web applications in this monorepo.

> **Status:** the files in this directory are a structural starter written before the shared packages existed. They will be aligned with the real package APIs during implementation (spec §18 step 7). In particular, `package.json` still uses the legacy `__APP_NAME__` placeholder and `@platform/` scope; the target is `@apps/__APP_SLUG__`.

## Create a new app

From the repository root:

```bash
pnpm create:app --slug finance --name "Finance" --description "Personal finance tools"
```

The generator validates the slug, copies this directory to `apps/<slug>`, replaces placeholders, assigns the next free dev port, registers the app in the Hub registry, prints the remaining manual steps and runs install/typecheck/lint/build.

If the generator has not been implemented yet, copy this directory to `apps/<slug>` and replace:

| Placeholder | Meaning | Example |
|---|---|---|
| `__APP_SLUG__` | URL-safe id: package name `@apps/<slug>`, hostname, registry id | `finance` |
| `__APP_DISPLAY_NAME__` | Human-readable name | `Finance` |
| `__APP_DESCRIPTION__` | One-line description (manifest, metadata, registry) | `Personal finance tools` |

Slug rules: lowercase letters, digits and hyphens; must not collide with an existing app or package, or with reserved names (`api`, `hub`, `www`, `admin`, `portainer`, `traefik`, ...).

## After generating

1. Search the app for remaining `__APP_` placeholders (the generator fails if any remain).
2. Local dev: add `127.0.0.1 <slug>.frigi.test` to `/etc/hosts`; the app runs at `https://<slug>.frigi.test:<port>` (ports 3002+; Hub is 3000, Hello 3001, API 4000). Make sure the mkcert certificate covers `*.frigi.test`.
3. Add the app's public URL to the API `TRUSTED_ORIGINS` (dev and prod) and the per-app URL variable used by the Hub registry.
4. Register the app in the Hub application registry (typed metadata: id, display name, description, URL, optional icon key). Rebuild Hub.
5. Add a Compose service with Traefik labels (`Host(\`<slug>.frigi.me\`)`, entrypoint `web`, network `traefik_net`) and bounded log rotation.
6. Add the public hostname `<slug>.frigi.me` to the Cloudflare Tunnel (Zero Trust dashboard) pointing to `http://traefik:80`.
7. Create a Firebase Web App (= GA4 web stream) and a Sentry project for the app; put the values in its build/deploy environment.
8. Ensure CI picks up the app for affected image builds; add `<APP>_IMAGE_TAG` to the root `compose.yml` image reference and the server `.env`.
9. Add `https://<slug>.frigi.me/healthz` to the external uptime checker and set up the app's Sentry alert rule.
10. Run `pnpm install`, `pnpm --filter @apps/<slug> typecheck`, `lint` and `build`.

## Access modes

Each route declares one of `public` (no session lookup), `optional` (signed-out and signed-in variants) or `authenticated` (redirect to Hub sign-in with `returnTo`), using the shared session helpers. The template contains one example route of each; delete the ones you don't need. Pass `--access` to the generator to set the app's registry `access` value (its entry point). API routes the app relies on declare their own `auth` mode; the API default is `required`.

## Rules

- Keep this app independently deployable (own container, own image, standalone output).
- Use shared packages; do not import Hub or another app's source.
- Keep route files thin and organize domain functionality under `src/features/`.
- Prefer Server Components. Use client components only where needed.
- Do not add app-specific copies of authentication or API clients.
- Route Handlers only for infrastructure endpoints (`/healthz`, SDK-required routes).
- Keep the CSP/security headers from the request proxy file.
- Add its own PWA manifest, icons and service-worker scope according to the platform PWA conventions.
- Never cache private authenticated data in the service worker.

## Observability for a generated app

- Use the shared `@platform/logger` for server-side logs. Docker captures stdout/stderr; logs are viewed through Portainer or `docker logs`.
- Use `@platform/analytics` for typed Firebase Analytics events. The SDK is not loaded before consent and never during SSR. Configure this app's Firebase web stream settings in its build environment; events carry `app_id`.
- Configure the official Sentry Next.js SDK for this app's browser/server runtimes, with its own Sentry project/DSN. `SENTRY_AUTH_TOKEN` exists only in CI.
- Follow root `docs/setup-guide.md` for provider-console actions, environment variables, MCP options and final verification.
