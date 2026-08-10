---
title: Data Sync Runbook
description: Safely preflight, run, verify, and recover synchronization jobs.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Data sync runbook

Synchronization writes provider data into PostgreSQL. It requires valid provider configuration, a
schema ready for the current code, and a writable season bound to the configured Biwenger league.

## Preflight

1. Confirm the database target without printing credentials.
2. Confirm the intended season and league values in local or deployment configuration.
3. Verify connectivity and schema readiness:

   ```bash
   npm run db:verify
   npm run db:verify:drizzle
   npm run db:check
   ```

4. For production or remote targets, confirm backups and follow [database safety](database-safety.md).
5. Ensure no scheduled/manual job is already active. The advisory lock will skip overlapping jobs,
   but job ownership should still be understood.

The CI scheduling configuration and runtime preflight tests provide additional protection against
accidentally enabling sync for a frozen season.

## Modes

| Command                    | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `npm run sync`             | Full ordered pipeline. Heavy metadata steps are included except step 11. |
| `npm run sync:daily`       | Routine refresh; skips initial squads, logos, images, and user colors.   |
| `npm run sync:live`        | Live-focused match, score, and lineup updates.                           |
| `npm run sync:playoffs`    | Apply custom playoff metadata and results from checked-in JSON.          |
| `npm run sync -- --step=N` | Run one numbered main-pipeline step for diagnosis or recovery.           |

The normal full pipeline registers:

1. Players
2. Master data
3. Matches
4. Standings and users
5. Player statistics
6. User lineups
7. Market transfers and bids
8. Current squad ownership
9. Initial squads
10. Team logos
11. Official player images
12. User colors
13. Prediction pools
14. Tournaments
15. Current market listings

Step 11 is disabled in normal global runs because the upstream official source is blocked. It runs
only when selected explicitly; maintained CSV/image utilities provide the alternative workflow.

## Execute and verify

Run the narrowest mode that satisfies the objective. The manager logs the resolved season, every
started/completed step, skips, and errors. A successful run clears the application memory cache,
releases its advisory lock, closes the connection, and exits successfully.

Afterward:

```bash
npm run db:check
```

Inspect representative application views and compare expected provider counts for the affected
domain. A zero exit code does not prove that the provider supplied every optional record.

## Failure and recovery

- If another worker owns the advisory lock, do not force it open; identify the active job and wait or
  stop that job safely.
- If season validation fails, correct configuration or use the season lifecycle. Never normalize a
  production frozen-season override.
- Critical steps stop subsequent work by default. Fix the cause and rerun the pipeline or the
  affected step; writes are designed to be idempotent.
- `--continue-on-error` and `SYNC_CONTINUE_ON_ERROR=true` are diagnostic compatibility options. Use
  them only when later steps are known not to depend on the failure.
- Provider authentication errors require a valid token; rate or incomplete-data errors may require a
  later retry.

See [troubleshooting](troubleshooting.md) for symptom-oriented diagnosis and
[external API reference](../reference/external-apis/README.md) for provider boundaries.
