---
title: Competition and Analytics
description: Rounds, matches, schedules, standings, comparisons, and advanced league analytics.
audience:
  - user
  - contributor
  - maintainer
  - agent
status: active
---

# Competition and analytics

## Routes

- `/rounds` explores round leaderboards, manager performance, lineups, and historical details.
- `/schedule` relates upcoming EuroLeague fixtures to fantasy users and squads.
- `/matches` groups real matches by date and round, including live or completed scores.
- `/standings` presents league ranking plus general, performance, valuation, captain, initial-squad,
  and novelty analytics.
- `/compare` compares selected managers or players through a lighter initial payload and detailed
  data on demand.

## Analytics families

Standings includes cumulative progression, rolling form, placements, round wins, volatility,
captain performance, efficiency, initial-squad outcomes, theoretical optimized lineups, all-play-all
comparison, and descriptive statistics such as bottlers, heartbreakers, jinx, and no-glory.

These values are derived from synchronized facts; they are not provider-owned leaderboards. Formula
or eligibility changes therefore require tests and a documentation update in the same pull request.

## Implementation map

- Pages: [`rounds`](<../../src/app/(app)/rounds>), [`schedule`](<../../src/app/(app)/schedule>),
  [`matches`](<../../src/app/(app)/matches>), [`standings`](<../../src/app/(app)/standings>), and
  [`compare`](<../../src/app/(app)/compare>).
- UI: matching domain folders under [`src/components`](../../src/components).
- Services: `roundsService`, `scheduleService`, `matchesService`, `standingsService`, and
  `compareService` under [`src/lib/services`](../../src/lib/services).
- Data: competition and analytics queries under
  [`src/lib/db/queries`](../../src/lib/db/queries).
- HTTP: `/api/rounds/*`, `/api/standings/*`, `/api/compare/*`, and `/api/league-average`.
- Tests: route suites under the corresponding [`src/app/api`](../../src/app/api) domains and logic
  tests under [`src/lib/logic/__tests__`](../../src/lib/logic/__tests__).

## Edge cases

Postponed rounds may be mapped to a canonical regular-season round. Playoff rounds with repeated
names remain distinct. Empty early-season histories, incomplete live scores, tied manager values,
and managers without a lineup must remain valid states rather than being silently converted to
zero-performance claims.
