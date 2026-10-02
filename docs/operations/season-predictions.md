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
season's player, EuroLeague team, and fantasy manager candidates. Existing windows cannot be
reopened or extended by this command.

## Rollout

1. Follow [database safety](database-safety.md): identify the target database, take and verify schema
   and data backups, and audit the current schema.
2. Apply committed migration `0020_season_predictions.sql` with `npm run db:migrate`. Verify with
   `npm run db:validate` and `npm run db:check`.
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

For a disposable local end-to-end check, run `npm run season-predictions:test:local`.
