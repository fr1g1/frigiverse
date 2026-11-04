# 0021. External uptime checks and Sentry alert rules

- Status: Accepted
- Date: 2026-11-04

## Context
Nothing notified the owner of outages. Sentry only sees errors from running code; logs are not watched (0008). The server is at home (power, ISP and tunnel outages are plausible).

## Decision
- A free external uptime-monitoring service (chosen by the user at setup) checks each app's `/healthz` and the API's `/health` every ~5 minutes and emails the user.
- Each Sentry project has an issue alert rule emailing on new and regressed issues.
- No self-hosted monitoring. Health endpoints stay unauthenticated, cheap, uncached and free of personal data.

## Alternatives considered
- Sentry uptime monitoring: single tool, but quota/plan-dependent.
- Self-hosted Uptime Kuma: runs on the monitored server, so it cannot report that server being down.
- Nothing: outages discovered by users.

## Consequences
- One more external account (user action). Each new app adds a monitor.
