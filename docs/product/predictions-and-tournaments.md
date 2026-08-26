---
title: Predictions and Tournaments
description: Prediction analytics, playoff data, and secondary competition behavior.
audience:
  - user
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Predictions and tournaments

## Routes and behavior

- `/predictions` analyzes Biwenger prediction-pool results, participation, accuracy, teams, rounds,
  and manager performance.
- `/playoffs` presents the custom EuroLeague playoff prediction leaderboard.
- `/tournaments` lists synchronized secondary competitions and aggregate statistics.
- `/tournaments/[id]` renders tournament standings, fixtures, and bracket/group structures.

## Implementation map

- Pages: [`predictions`](<../../src/app/(app)/predictions>), [`playoffs`](<../../src/app/(app)/playoffs>),
  and [`tournaments`](<../../src/app/(app)/tournaments>).
- UI: corresponding folders under [`src/components`](../../src/components).
- Services: `predictionsService`, `playoffService`, `tournamentService`, and `statsService` under
  [`src/lib/services`](../../src/lib/services).
- Data: feature queries and tournament queries/mutations under [`src/lib/db`](../../src/lib/db).
- Sync: `biwenger-board` and `biwenger-tournaments`, plus the separate playoff command and
  [`playoff-data.json`](../../src/lib/sync/playoffs/playoff-data.json).

## Source distinctions

Biwenger prediction pools and tournaments arrive through the normal pipeline. Custom playoff
metadata and results use a checked-in JSON source processed by `npm run sync:playoffs`. That command
still writes to PostgreSQL and must follow season and database safety rules.

Provider tournament structures can contain groups, knockout brackets, fixtures, or incomplete
phases. UI code must tolerate whichever structures are actually returned rather than assuming one
fixed bracket shape.
