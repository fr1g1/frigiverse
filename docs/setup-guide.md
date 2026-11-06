# Setup guide — local machine and cloud services

This document is an operational checklist for the implementer (Claude Code) and the user. Claude Code must keep it aligned with the actual code and report exact user actions at the end. Values shown as `<...>` are placeholders, not real credentials.

> **Status:** written before implementation (2026-11-03). Environment variable names, ports and paths are the planned defaults from `project-spec.md`; every item marked *(verify)* must be confirmed against the implemented code and the installed library versions' official docs before it is presented as final.

## 1. Responsibility boundaries

Claude can implement code, Docker Compose files, env validation, SDK integration, CI workflows, docs, tests and verification commands. The user must sign in to provider accounts (Google Cloud, Firebase, Sentry, Cloudflare, GitHub), accept terms, approve billable resources, control DNS, enter secrets locally, run commands on the home server, and decide privacy/consent policy. Claude must not claim that a cloud setup is complete unless it verified it.

**Never paste secrets into chat and never commit them. This repository is public.**

## 2. Local development machine (Fedora)

### 2.1 Tools

- [ ] fnm (Fast Node Manager): `curl -fsSL https://fnm.vercel.app/install | bash` (or `cargo install fnm`), then add `eval "$(fnm env --use-on-cd --version-file-strategy=recursive)"` to `~/.bashrc`. Official docs: https://github.com/Schniz/fnm
- [ ] Node.js 24 LTS: in the repository run `fnm install` (reads `.node-version`). Do not use the Fedora `nodejs24` package; it lags upstream security releases.
- [ ] pnpm 11: `npm install -g pnpm@11` once; pnpm then switches to the exact version pinned in the root `package.json` automatically. (Corepack is experimental in Node 24 and removed from Node 25, so it is not used.)
- [ ] Docker **Engine** with Compose v2, using the `default` context (`docker context use default`). Docker Desktop is not assumed by these docs.
- [ ] Git, GitHub CLI (`gh auth login`), Claude Code.
- [ ] mkcert (not installed yet): `sudo dnf install mkcert nss-tools`, then `mkcert -install` (installs a local CA trusted by Firefox/Chrome).
- [ ] Playwright browsers: `pnpm exec playwright install chromium` (without `--with-deps`, which uses apt). Fedora is not an officially supported Playwright OS; local e2e usually works, but the authoritative e2e run is on Ubuntu in CI.
- [ ] Lefthook hooks are installed automatically by `pnpm install` *(verify once implemented)*.

### 2.2 Local hostnames

Add to `/etc/hosts`:

```text
127.0.0.1 hub.frigi.test hello.frigi.test api.frigi.test
```

Each generated app adds `127.0.0.1 <slug>.frigi.test`. Never use a `frigi.me` subdomain for local development — the production session cookie (`Domain=frigi.me`) would be sent to local servers.

### 2.3 Local HTTPS certificate

```bash
mkdir -p certs
mkcert -cert-file certs/frigi.test.pem -key-file certs/frigi.test-key.pem "*.frigi.test" frigi.test
```

`certs/` is git-ignored. The dev scripts point Next.js (`--experimental-https` with key/cert) and Fastify (`https` option) at these files *(verify flags against installed Next.js)*.

### 2.4 Environment files

- [ ] Copy each `.env.example` to its ignored local file (`.env` / `.env.local` as documented per app) and fill in **development** values only.
- [ ] Generate a dev Better Auth secret locally (e.g. `openssl rand -base64 32`); never reuse the production secret.
- [ ] Analytics stays disabled in development; Sentry is disabled or uses `environment=development`.

### 2.5 Run

```bash
pnpm install
docker compose -f compose.dev.yml up -d   # PostgreSQL only
pnpm db:migrate
pnpm dev
```

Expected: Hub at `https://hub.frigi.test:3000`, Hello at `https://hello.frigi.test:3001`, API health at `https://api.frigi.test:4000/health`.

Optional pre-deploy smoke test: run the production `compose.yml` locally against a separate local volume *(command documented once implemented)*.

## 3. Google Cloud — OAuth clients and consent screen

Official docs: https://developers.google.com/identity/protocols/oauth2/web-server and the Better Auth Google provider docs.

- [ ] Create or select a Google Cloud project for the platform (it can be the project Firebase uses). Record the project ID; do not guess it.
- [ ] Configure the OAuth consent screen (Google Auth Platform → Branding/Audience): user type **External**, app name, support email, scopes `openid`, `email`, `profile`.
- [ ] Add the application home page `https://hub.frigi.me` and privacy policy `https://hub.frigi.me/privacy`. Add `frigi.me` as an authorized domain (requires domain verification in Google Search Console).
- [ ] While in **Testing**, only listed test users can sign in. Because sign-up is open, **publish** the app ("In production") once the privacy policy is live. Basic scopes normally need only brand verification *(verify current Google requirements)*.
- [ ] Create **two** OAuth clients of type *Web application*:

| Client | Authorized JavaScript origins | Authorized redirect URI |
|---|---|---|
| `platform-dev` | `https://hub.frigi.test:3000` | `<BETTER_AUTH_URL dev>` + Better Auth Google callback path |
| `platform-prod` | `https://hub.frigi.me` | `<BETTER_AUTH_URL prod>` + Better Auth Google callback path |

  Better Auth's documented default callback is `<baseURL>/api/auth/callback/google`, i.e. `https://api.frigi.test:4000/api/auth/callback/google` (dev) and `https://api.frigi.me/api/auth/callback/google` (prod). **(verify)** against the installed Better Auth version and the implemented `basePath` before entering it.
- [ ] Put the dev client ID/secret only in the local API env; the prod client ID/secret only in the server's API env.

## 4. Firebase Analytics / GA4

Official entry points:

- Firebase Console: https://console.firebase.google.com/
- Firebase Web setup: https://firebase.google.com/docs/web/setup
- Firebase Analytics for web: https://firebase.google.com/docs/analytics/get-started
- Google Analytics: https://analytics.google.com/
- Firebase MCP: https://firebase.google.com/docs/ai-assistance/mcp-server
- Google Analytics MCP (read-only reporting): https://developers.google.com/analytics/devguides/MCP

Arrangement: **one Firebase project → one GA4 property → one web data stream (Firebase Web App) per Next.js app.** Spark (no-cost) plan.

- [ ] Create/link a Firebase project and enable Google Analytics; create (or link) the GA4 property.
- [ ] Register a Firebase Web App for each app: `hub`, `hello` (and each future app). Record each app's config and measurement ID.
- [ ] In GA4 → Admin → Custom definitions, register the event parameter `app_id` as an event-scoped custom dimension.
- [ ] Data retention: choose the retention period (Admin → Data collection and modification → Data retention) and record it in the privacy policy.
- [ ] Restrict the Firebase web API keys to the platform's HTTP referrers (`https://*.frigi.me/*`) in Google Cloud Console → APIs & Services → Credentials, where supported.
- [ ] Per-app reports: use the "Stream name" dimension or the `app_id` custom dimension in comparisons, explorations or report collections.
- [ ] Verify the current plan limits for streams per property and apps per Firebase project *(verify)*.

Per-app build-time variables (public client config, baked into the image; analytics still waits for consent):

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_ANALYTICS_ENABLED=false   # true only in production builds
```

Do not add Firebase Admin credentials or service-account JSON to any browser bundle. Firebase Authentication is not used.

## 5. Consent and privacy

- [ ] Consent banner behavior (implemented in code): SDK not loaded until "Accept analytics"; "Reject" equally prominent; "Privacy settings" in every footer re-opens the choice; withdrawal disables collection and deletes `_ga*` cookies.
- [ ] Consent cookie: shared, versioned, scoped to the platform cookie domain (`frigi.me` / `frigi.test`). Bump the version when the privacy policy's analytics purposes change.
- [ ] Privacy policy (`https://hub.frigi.me/privacy`): Claude drafts it from the implemented data flows. **User action:** fill in the controller name and contact via the configuration placeholders, review the text (it is not legal advice), and keep it current.
- [ ] Data export requests are handled manually: document the command used to export a user's rows *(added during implementation)*.

## 6. Sentry Cloud

Official entry points:

- Sentry: https://sentry.io/
- Next.js SDK: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Node/Fastify SDK: https://docs.sentry.io/platforms/javascript/guides/fastify/
- Sentry MCP: https://mcp.sentry.dev/

- [ ] Create/sign in to a Sentry account and organization (free Developer plan; verify current quota — it is shared across projects).
- [ ] Create projects: `hub` (Next.js), `hello` (Next.js), `api` (Node.js / Fastify), and one per future app.
- [ ] Set per-project spike protection / rate limits so one noisy project cannot exhaust the shared quota.
- [ ] Copy each project's DSN into that deployable's configuration (Next apps: build-time public variable; API: runtime variable).
- [ ] Create an **organization auth token** with only the scopes needed for source-map/release upload. Store it as a GitHub Actions secret (`SENTRY_AUTH_TOKEN`) — not in any `.env` on the server, not with `NEXT_PUBLIC_`.
- [ ] Verify scrubbing: no cookies, authorization headers, request bodies, OAuth data or unnecessary personal data in events.
- [ ] Verify a controlled test error from each runtime (browser, Next.js server, API) reaches the correct project with resolved stack traces.
- [ ] Verify CSP Report-Only violations appear in Sentry (security reports) *(endpoint from Sentry project settings → Security Headers)*.
- [ ] **Alert rules:** in each project, an issue alert that emails you on new and regressed issues (Alerts → Create Alert → Issues). Keep it to that initially to avoid noise.

Expected variables:

```dotenv
# Next.js apps (build time)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=<git sha, set by CI>
# CI only
SENTRY_AUTH_TOKEN=
# API (runtime)
SENTRY_DSN=
```

## 7. GitHub

- [ ] Create the **public** repository `frigiverse` and push `main` (`gh repo create frigiverse --public --source . --push` — user action). Public from day one.
- [ ] Settings → Code security: enable **secret scanning** and **push protection**.
- [ ] Settings → Actions: require approval for workflows from first-time/outside contributors; default `GITHUB_TOKEN` permissions read-only (workflows request `packages: write` explicitly).
- [ ] Actions secrets (repository): `SENTRY_AUTH_TOKEN`. Actions variables: public build config (`NEXT_PUBLIC_*` per app, `SENTRY_ORG`, Sentry project slugs). Secrets are not available to fork PRs.
- [ ] GHCR: images publish as `ghcr.io/fr1g1/frigiverse-<app>` (e.g. `frigiverse-hub`) *(verify naming once CI exists)*. Public images are acceptable (they contain only public config); otherwise create a fine-grained token with `read:packages` for the server.
- [ ] Install the Renovate GitHub App on the repository.
- [ ] **Branch protection on `main`** (Settings → Rules → Rulesets, or Branches → Branch protection rule): require a pull request before merging (0 required approvals — solo repo, self-merge allowed), require status checks to pass (the PR workflow jobs: lint, format, typecheck, unit, e2e, build — select them after the first CI run), require branches to be up to date, block force pushes and deletion. Allow squash merges; enable "Automatically delete head branches".
- [ ] First push: protection can only reference checks that have run once — push the initial commit to `main`, let CI run, then enable the ruleset.

## 8. Cloudflare — DNS, Tunnel and edge settings

Target: **Cloudflare Tunnel** (no inbound router ports). Official docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

### 8.1 Check the current setup

- [ ] Dashboard → `frigi.me` → **SSL/TLS → Overview**: note the mode (Off / Flexible / Full / Full (strict)).
- [ ] **Zero Trust → Networks → Tunnels**: does a tunnel already exist?
- [ ] **DNS → Records**: `CNAME … cfargotunnel.com` means tunnel; proxied `A` record to the home IP means orange-cloud proxy.
- [ ] On the server: `docker ps | grep cloudflared` / `systemctl status cloudflared`.

### 8.2 Tunnel

- [ ] Zero Trust → Networks → Tunnels → create a tunnel (connector type *cloudflared*), copy the **tunnel token** into the server's `infra/.env` (`TUNNEL_TOKEN`) — never into Git.
- [ ] Public hostnames, all pointing to service `http://traefik:80`:
  - `hub.frigi.me`, `hello.frigi.me`, `api.frigi.me` (and each future `<slug>.frigi.me`).
- [ ] Do **not** add hostnames for Portainer or the Traefik dashboard.
- [ ] Apex redirect `frigi.me` → `https://hub.frigi.me`: a Cloudflare Redirect Rule (Rules → Redirect Rules) on a proxied apex record *(verify current recommended pattern)*.
- [ ] After the tunnel works: remove router port forwards for 80/443 and remove old `A` records pointing to the home IP.

### 8.3 Edge settings

- [ ] SSL/TLS: **Always Use HTTPS** on; enable **HSTS** (start with a short max-age, then increase; include subdomains only once every `*.frigi.me` host serves HTTPS).
- [ ] Caching: Cache Rule to **bypass cache** for `api.frigi.me`; do not cache HTML/session responses for app hostnames.
- [ ] Disable HTML-rewriting features for platform hostnames: Rocket Loader, Email Address Obfuscation, auto-minify (if present), and any script injection (Web Analytics beacon auto-inject).
- [ ] Security: keep Bot Fight Mode from blocking the OAuth callback (`api.frigi.me/api/auth/*`) — verify sign-in after enabling any bot protection.

## 9. Home server — infra stack (Traefik, cloudflared, Portainer)

Production server: home server, linux/amd64. Remote administration via the user's existing WireGuard VPN.

- [ ] Clone the repository on the server (or copy `infra/` and `compose.yml`).
- [ ] Create `infra/.env` from `infra/.env.example`: `TUNNEL_TOKEN`, `ADMIN_BIND_IP` (LAN or WireGuard address of the server).
- [ ] Migrate from the current hand-written Traefik Compose file to `infra/compose.yml` (same `traefik_net` network name, so existing app stacks keep working):
  - dashboard published only on `${ADMIN_BIND_IP}:8080` (no more `0.0.0.0:8080`);
  - obsolete `version:` key removed; bounded `local` log rotation;
  - optional later hardening: Docker socket proxy.
- [ ] Portainer CE published only on `${ADMIN_BIND_IP}`; set the admin password on first start immediately.
- [ ] `docker compose -f infra/compose.yml up -d`; verify Traefik dashboard and Portainer are reachable only via LAN/WireGuard (and **not** from a phone on mobile data without VPN).
- [ ] Remove the legacy `tmp.frigi.me` (`testapp`) stack and its tunnel hostname once Hello is deployed — every `*.frigi.me` host receives the session cookie.

## 10. Home server — app stack deployment

- [ ] Create the server's root `.env` from `.env.example` (production values): database credentials, `BETTER_AUTH_SECRET` (new random value), `BETTER_AUTH_URL=https://api.frigi.me`, prod Google OAuth client, `AUTH_COOKIE_DOMAIN=frigi.me`, `TRUSTED_ORIGINS=https://hub.frigi.me,https://hello.frigi.me`, API `SENTRY_DSN`, backup settings, and pinned image tags `HUB_IMAGE_TAG`, `HELLO_IMAGE_TAG`, `API_IMAGE_TAG` (git SHAs from the GHCR packages / CI run summary — never `latest`).
- [ ] If GHCR images are private: `docker login ghcr.io` with a read-only token.
- [ ] First deploy:

  ```bash
  docker compose pull
  docker compose up -d postgres
  docker compose --profile migrate run --rm migrate
  docker compose up -d
  ```

- [ ] Every later deploy: **note current tags → set new tag(s) in `.env` → backup → migrate (if the release contains migrations) → pull → up**:

  ```bash
  grep _IMAGE_TAG .env >> deploy.log && date >> deploy.log   # remember what was running
  # edit .env: set the new SHA for each changed app
  docker compose exec backup <backup-now command>      # (verify once implemented)
  docker compose --profile migrate run --rm migrate
  docker compose pull && docker compose up -d
  ```

- [ ] Logs: Portainer → container → Logs, or `docker logs --tail 100 -t <container>` / `docker logs -f <container>`.

### 10.1 Rollback

- [ ] Set the previous SHA tag(s) from `deploy.log` in `.env`, then `docker compose up -d`. Do **not** roll back migrations — they are backward-compatible by rule (spec §8.1).
- [ ] Only for data corruption: restore the pre-deploy backup (loses data written since). Document the date.
- [ ] Exercise one rollback after the first real deploy and record the date: `<YYYY-MM-DD>`.

### 10.2 Uptime monitoring

- [ ] Create an account at a free external uptime-monitoring service of your choice (outside the home server). Choose one that does not require putting anything on `frigi.me` and use an email for notifications.
- [ ] HTTP(S) monitors, interval ≈5 min, expecting 200: `https://hub.frigi.me/healthz`, `https://hello.frigi.me/healthz`, `https://api.frigi.me/health` (and each future app's `/healthz`).
- [ ] Trigger a test: stop one container briefly and confirm the alert email arrives, then start it again.

### 10.3 Backups

- [ ] Confirm nightly dumps appear in the host backup directory with the configured retention (7 daily / 4 weekly / 6 monthly).
- [ ] **Perform one restore test** into a throwaway database and record the date here: `<YYYY-MM-DD>`.
- [ ] Accepted risk: no off-site copy. Revisit before real users (encrypted copy to object storage or another location).

## 11. Environment variable inventory (planned; finalize during implementation)

| Variable | Used by | Scope | Dev example | Prod example |
|---|---|---|---|---|
| `DATABASE_URL` | API, migrate | runtime secret | `postgres://…@localhost:5432/platform` | internal `postgres` host |
| `BETTER_AUTH_SECRET` | API | runtime secret | local random | server random |
| `BETTER_AUTH_URL` | API | runtime | `https://api.frigi.test:4000` | `https://api.frigi.me` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | API | runtime secret | dev client | prod client |
| `AUTH_COOKIE_DOMAIN` | API | runtime | `frigi.test` | `frigi.me` |
| `TRUSTED_ORIGINS` | API | runtime | `https://hub.frigi.test:3000,https://hello.frigi.test:3001` | `https://hub.frigi.me,https://hello.frigi.me` |
| `SENTRY_DSN` | API | runtime | empty | `api` project DSN |
| `NEXT_PUBLIC_APP_URL` | each Next app | build | `https://<slug>.frigi.test:<port>` | `https://<slug>.frigi.me` |
| `NEXT_PUBLIC_API_URL` | Next apps | build | `https://api.frigi.test:4000` | `https://api.frigi.me` |
| `NEXT_PUBLIC_HUB_URL` | Next apps | build | `https://hub.frigi.test:3000` | `https://hub.frigi.me` |
| `API_INTERNAL_URL` | Next apps (server) | runtime | `https://api.frigi.test:4000` | `http://api:4000` |
| `NEXT_PUBLIC_CONSENT_COOKIE_DOMAIN` | Next apps | build | `frigi.test` | `frigi.me` |
| `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_ANALYTICS_ENABLED` | Next apps | build | disabled | per-app stream |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Next apps | build | empty | per-app project |
| `SENTRY_AUTH_TOKEN` | CI only | CI secret | — | GitHub secret |
| `TUNNEL_TOKEN` | cloudflared | infra secret | — | server `infra/.env` |
| `ADMIN_BIND_IP` | Traefik dashboard, Portainer | infra | — | LAN/WireGuard IP |
| `HUB_IMAGE_TAG`, `HELLO_IMAGE_TAG`, `API_IMAGE_TAG` (`<APP>_IMAGE_TAG` per app) | root `compose.yml` | server deploy | — (dev runs natively) | git SHA |

## 12. Verification (end-to-end)

- [ ] `https://api.frigi.me/health` returns OK; `https://api.frigi.me/api/me` returns 401 when signed out.
- [ ] Sign in on Hub with Google (manual); Hub shows the profile.
- [ ] Open Hello: same user shown without signing in again. Sign-in started from Hello returns to Hello.
- [ ] Sign out in one app; the other reflects it on next load.
- [ ] Delete account on Hub; sessions are gone and the user cannot access `/api/me`.
- [ ] Analytics: no requests to Google Analytics before consent (browser devtools → Network); events appear in GA4 DebugView after consent; withdrawal stops them.
- [ ] Sentry: controlled test errors from browser, Next.js server and API arrive in the right projects with source maps.
- [ ] CSP Report-Only header present; reports arrive in Sentry.
- [ ] PWA: Hub and Hello installable separately; offline fallback shown; no authenticated responses in Cache Storage.
- [ ] Portainer shows all containers and logs; not reachable without LAN/WireGuard.
- [ ] Backups present; restore tested.
- [ ] Rollback to the previous tags exercised once.
- [ ] Uptime monitors green; a stopped container triggers an alert email.
- [ ] Sentry alert rules exist in every project.
- [ ] `main` rejects a direct push; a PR cannot merge with failing checks.

## 13. Optional MCP servers for Claude Code

MCP servers are development-time tools for Claude Code. They are not required by the deployed applications and must not be included in runtime containers. Use only official/current endpoints and authenticate as the user. Review requested permissions before approving actions.

### Firebase MCP — official, local stdio server

Documentation: https://firebase.google.com/docs/ai-assistance/mcp-server

Recommended Claude Code setup (official Firebase plugin):

```bash
claude plugin marketplace add firebase/firebase-tools
claude plugin install firebase@firebase
```

Alternative direct MCP registration from the repository directory:

```bash
claude mcp add firebase npx -- -y firebase-tools@latest mcp
claude mcp list
```

The server runs locally and uses Firebase CLI user credentials / Application Default Credentials. Do not assume every GA4 administration action is available through it; verify the current tool list.

### Sentry MCP — official remote HTTP server

Documentation: https://mcp.sentry.dev/

```bash
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp/<organizationSlug>/<projectSlug>
```

Claude Code will run the OAuth authorization flow. Scope to the smallest useful project. Do not grant write/management actions unless needed and explicitly approved.

### Google Analytics MCP — optional read-only reporting

Documentation: https://developers.google.com/analytics/devguides/MCP

A separate local Python MCP server for querying GA4 reports (read-only). Requires Python 3.10+, `uv` (installed on the dev machine) or `pipx`, the Google Analytics Admin API and Data API enabled, and an identity with Viewer access to the GA4 property.

```bash
claude mcp add analytics-mcp --scope user \
  -e GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/adc.json" \
  -e GOOGLE_CLOUD_PROJECT="<google-cloud-project-id>" \
  -- uvx analytics-mcp
```

*(verify the package/command name in the official docs.)* Prefer user ADC credentials; never put credentials JSON in the repository.

### Portainer / Docker MCP status

Do not install the old `portainer/portainer-mcp` repository as a supported production integration; its repository states it is no longer the supported way to use an LLM with Portainer (Portainer Command is for eligible Business Edition users). Claude can use reviewed Docker CLI/Compose commands locally. Require explicit approval before destructive container, volume, image, network or host operations. Claude has no access to the home server unless the user explicitly grants it.

Reference: https://github.com/portainer/portainer-mcp

## 14. Required final setup report from Claude Code

At the end of implementation, produce a table with these columns: `Area`, `Status`, `Exact action for user`, `Where to do it`, `Value/URL to copy`, `Verification`. Include separate groups for: local machine; Google Cloud OAuth; Firebase/GA4; consent/privacy; Sentry; GitHub; Cloudflare/DNS; home server infra; deployment/backups. Distinguish `Done and verified`, `Prepared but needs user action`, `Blocked`, and `Not applicable`.

Always list exact callback URLs and environment variable names only after deriving them from the implemented app and current official documentation. Never invent IDs, credentials, URLs or successful provider configuration. Ask before billable resource creation, public exposure, destructive actions or changing permissions.
