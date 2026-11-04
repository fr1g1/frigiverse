# 0014. Local nightly backups, manual profile-gated migrations

- Status: Accepted (amended by [0019](0019-release-pinning-and-rollback.md): pinned SHA tags, expand/contract migrations, rollback)
- Date: 2026-11-03

## Context
The database holds user accounts of an open-sign-up platform. Destructive migrations must never run unattended.

## Decision
- Backup service in the app Compose stack: nightly compressed `pg_dump` to a host directory, retention 7 daily / 4 weekly / 6 monthly; restore procedure documented and tested once.
- No off-site copy for now — **accepted risk**, revisit before real users; any future off-site copy must be encrypted.
- Production migrations via a profile-gated one-off `migrate` service (API image). Deploy order: backup → migrate → pull/up. Never at API startup, never from CI.

## Alternatives considered
- Host cron + `docker exec`: config outside Git.
- Automatic migrate job before API start: unreviewed destructive migrations.
- Off-site via rclone to R2/B2, or NAS: deferred.

## Consequences
- Disk loss, theft, fire or host compromise loses all data until off-site backups exist.
