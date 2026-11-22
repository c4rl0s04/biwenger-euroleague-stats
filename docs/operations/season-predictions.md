---
title: Season predictions
description: Deploy the closed predictions page and open its seven-day window for a season.
audience:
  - operator
  - maintainer
status: active
---

# Season predictions

The `/season-predictions` page stays closed until an operator opens a window for a specific season.
No submission is accepted before that operation. The window snapshots the 12 questions and the
season's player, EuroLeague team, and fantasy manager candidates. A locked preseason window can be
reopened once (see [Reopen once](#reopen-once)); it cannot otherwise be extended.

Windows and submissions are scoped by phase. Migration `0021_prediction_phases.sql` keys them by
`(season_id, phase)` and `(season_id, phase, user_id)`, backfills existing rows as `preseason`, and
adds `official_schedule_games` for the upcoming playoff bracket. The opening command and the page
currently handle only the `preseason` phase.

## Rollout

1. Follow [database safety](database-safety.md): identify the target database, take and verify schema
   and data backups, and audit the current schema.
2. Apply committed migrations `0020_season_predictions.sql` and `0021_prediction_phases.sql` with
   `npm run db:migrate` while no preseason window is open. Verify with `npm run db:validate` and
   `npm run db:check`, then deploy the matching application version immediately: saves from older
   code fail once the submission key includes the phase.
3. Deploy the application. The page shows a closed state until the separate opening command runs.
4. Preview candidate counts for the intended season:

   ```bash
   npm run season-predictions:open -- --season 2026-27
   ```

5. Confirm that the three lists are complete, then deliberately open the window:

   ```bash
   npm run season-predictions:open -- --season 2026-27 --apply
   ```

The database records the opening timestamp and sets the lock exactly 168 hours later. The command
refuses a season with any empty candidate list and refuses a second opening. Roster changes after
opening do not change the frozen choices. The browser countdown is informational; PostgreSQL time
controls the lock. After the lock, submissions are read-only and visible only to members of that
same season. This release does not score predictions.

## Reopen once

A locked preseason window can be reopened exactly once, for example when few members answered
before the lock. Questions, candidates, existing submissions and revisions are kept; only the lock
moves. Preview the effect first, then apply it deliberately:

```bash
npm run season-predictions:open -- --season 2026-27 --reopen --hours 72
npm run season-predictions:open -- --season 2026-27 --reopen --hours 72 --apply
```

The new lock is database time plus the given hours (1 to 336). The command refuses a window that
is still open or was already reopened, and records the reopening in `reopened_at`. Because league
answers were visible while the window was locked, announce the reopening to the league.

## Playoffs bracket window

The playoffs window freezes the `euroleague-v1` bracket template and seeds 1-10 from the final
regular-season standings (`official_team_standings` joined to `official_team_mappings`). Preview
it first; the preview lists seeds, unmapped team codes, the first play-in tip-off and any problem:

```bash
npm run season-predictions:open -- --season 2027-28 --phase playoffs
npm run season-predictions:open -- --season 2027-28 --phase playoffs --apply
```

`--apply` refuses unless every regular-season game in `official_schedule_games` is played, all ten
seeds exist and are mapped, and the play-in is scheduled and has not started. The window locks at
the first play-in tip-off; saves use the earlier of that lock and the current first play-in
`scheduled_at`, so a rescheduled play-in still locks the bracket. Results and points are computed at
read time from `official_schedule_games`; 2025-26 stays in the legacy playoff tables.

For a disposable local end-to-end check, run `npm run season-predictions:test:local`.
