# Instructions for this application

- Follow the repository root `AGENTS.md` and `project-spec.md`.
- This is an independent app (`@apps/__APP_SLUG__`); do not import another app's source.
- Use shared packages for UI, auth, API client and shared schemas.
- Keep features under `src/features/` and keep App Router files thin.
- Prefer Server Components; use client components only for interactivity.
- Every route declares an access mode (`public`, `optional`, `authenticated`) via the shared session helpers; `public` routes do no session lookup.
- Session: read it server-side via `API_INTERNAL_URL` with the forwarded cookie header (never logged); use the shared auth-client hook for interactive updates. Sign-in links go to the Hub `/sign-in?returnTo=<this app URL>`.
- Do not duplicate auth configuration or create a separate backend. Route Handlers only for infrastructure endpoints (`/healthz`, SDK-required routes).
- Keep the request proxy file (`proxy.ts`) with the shared CSP builder and baseline security headers.
- Configure this app's own PWA manifest and service-worker scope.
- Do not cache authenticated/private responses or `/healthz`.

- Use `@platform/logger`, `@platform/analytics` and `@platform/error-tracking` according to the root specification.
- Do not load Firebase Analytics before consent; initialize only in the browser, never from Server Components/SSR. Use the shared consent banner and footer.
- Configure Sentry's required Next.js per-app files and environment variables; shared helpers do not replace SDK-required instrumentation.
- Use this app's own Firebase web stream (measurement ID) and Sentry project/DSN as documented.
- Keep Pino server logging on stdout/stderr; do not write logs to container files.
- UI text is English only.
