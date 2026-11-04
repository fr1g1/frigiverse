# 0020. Protected `main`, PRs with required checks

- Status: Accepted
- Date: 2026-11-04

## Context
The repository is public, worked on by the owner and coding agents, and images are built from `main` (0003). A broken commit on `main` produces a broken image.

## Decision
- `main` is protected (GitHub ruleset): pull request required, 0 approvals (self-merge allowed), required status checks (lint, format, typecheck, unit, e2e, build), up-to-date branch, no force push, no deletion.
- Short-lived branches (`feat/…`, `fix/…`, `chore/…`, `docs/…`); squash merges; head branches auto-deleted.
- Agents never commit to `main`; they work on a branch and commit/push/open PRs only when the user asks.
- Image builds run only on `main` after merge. Renovate PRs pass the same checks.
- Bootstrap: the initial commit goes to `main` directly; protection is enabled after CI has run once so the checks can be selected.

## Alternatives considered
- Direct pushes to `main`: fastest, but unchecked code becomes images.
- PRs only for agents, unenforced: relies on discipline.

## Consequences
- Every change, including docs, needs a PR and a green CI run.
