# 0019. Pinned SHA image tags, expand/contract migrations, tag-based rollback

- Status: Accepted
- Date: 2026-11-04

## Context
CI pushes images tagged with the git SHA and `latest` (0003); deploys are manual (0003, 0014). There was no defined way to return to the previous release, and a release containing a migration could make the previous image incompatible with the schema.

## Decision
- The production `compose.yml` references every image as `…:${<APP>_IMAGE_TAG}`; the server `.env` pins each to a git-SHA tag. `latest` is never used by the production stack. The migrate service uses the API tag.
- Deploy: record current tags (`deploy.log`) → set new tags → backup → migrate (if needed) → `pull` + `up -d`.
- Rollback: set the previous tags → `up -d`. Migrations are never rolled back.
- All migrations are backward-compatible with the previous release (expand/contract). Destructive steps ship in a later release. Exceptions need the user's approval and are called out in the PR.
- Restoring the pre-deploy backup is the last resort for data corruption only.

## Alternatives considered
- Pinned tags without migration discipline, restore backup on rollback: loses data written since the deploy.
- `latest` only: not reproducible, rollback requires ad-hoc retagging.
- Down-migrations: Drizzle has no first-class down migrations; they are rarely tested and risky.

## Consequences
- Schema changes that rename/drop take two releases.
- The server `.env` carries one tag variable per deployable; the app template checklist adds it.
