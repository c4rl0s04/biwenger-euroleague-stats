---
title: Troubleshooting
description: Symptom-oriented diagnosis for local startup, authentication, database, and sync failures.
audience:
  - newcomer
  - contributor
  - operator
  - maintainer
  - agent
status: active
---

# Troubleshooting

Start with the narrowest read-only check and preserve the original error output. Do not reset a
database or bypass a guard merely to make a symptom disappear.

## Application does not start

1. Confirm Node.js 20+, `npm ci`, and required environment values.
2. Run `npm run typecheck` to separate compile-time problems from runtime configuration.
3. Run `npm run db:verify` if the error references PostgreSQL.
4. With `SKIP_DB=true`, use `npm run build` to determine whether the application can compile without
   a live database.

## Login loops or rejects valid-looking credentials

- Confirm the user exists in the synchronized `users` table and has a password hash.
- Confirm `AUTH_SECRET` is stable across requests/containers.
- Inspect server logs without printing passwords or tokens.
- Clear the browser session only after server-side configuration has been checked.

## Database connection errors

- Determine whether `DATABASE_URL` is overriding individual `POSTGRES_*` values.
- Inside Docker, use the container-visible host rather than assuming `localhost` reaches PostgreSQL.
- Run `npm run db:verify` and `npm run db:verify:drizzle`.
- Do not delete a Docker volume to fix roles or schema until it is confirmed disposable.

## Sync does not run

- A Docker sync worker sleeps intentionally when `DATABASE_URL` is present.
- Verify the season exists, is active, has a source league, and matches configuration.
- Check whether another worker owns the advisory lock.
- Confirm the GitHub workflow is enabled for the intended season.
- For step 11 image behavior, remember it is skipped in normal global runs.

Follow the [data sync runbook](data-sync.md) for safe reruns.

## Data is missing or stale

Identify which domain and numbered sync step owns the record. Check that step's logs and compare
provider availability before rerunning it. Live matches and provider box scores may be incomplete
temporarily; a missing optional record is different from a failed sync.

For player-price drift, use the dry-run repair described in [database safety](database-safety.md).
For cross-season results, stop sync and perform the [season audit](season-lifecycle.md) before making
changes.

## Documentation checks fail

Run `npm run docs:check` locally. Fix the reported frontmatter, relative path, missing asset, or
formatting error. External URL availability is not part of the blocking local-link check.
