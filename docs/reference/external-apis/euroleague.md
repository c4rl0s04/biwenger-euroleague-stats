---
title: EuroLeague Advanced API
description: Official sporting-data provider contract used from the 2026-27 season.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# EuroLeague Advanced API

From `2026-27`, [`euroleague-advanced-client.ts`](../../../src/lib/api/euroleague-advanced-client.ts)
is the primary sporting-data source. The old official client remains behind the manual
`EUROLEAGUE_OFFICIAL_PROVIDER=legacy` switch for the first two rounds only. There is no automatic
fallback because one run must never mix official providers.

The client validates every response boundary with Zod, times out after 20 seconds, retries `429`,
network errors, and `5xx`, and treats future-game `404` responses as data not yet available. An
optional bearer token is supported, but the initial integration only consumes free endpoints.

## Free endpoint ownership

| Dataset                                           | Advanced API path                   |
| ------------------------------------------------- | ----------------------------------- |
| Schedule and arenas                               | `/Euroleague/schedule`              |
| Standings and crests                              | `/Euroleague/standings`             |
| Season player profiles                            | `/Euroleague/players/season`        |
| Game report                                       | `/Euroleague/games/report/game`     |
| Live metadata, score, quarters, coaches, referees | `/Euroleague/games/metadata/game`   |
| Player boxscore                                   | `/Euroleague/boxscore/players/game` |
| Play-by-play                                      | `/Euroleague/play-by-play/game`     |
| Shots                                             | `/Euroleague/shot-data/game`        |

The provider year is derived from `EUROLEAGUE_SEASON_CODE=E2026` and must match
`SEASON_ID=2026-27`. The sync rejects a mismatched season before writing.

## Persistence and matching

`official_games` is the canonical calendar. Granular boxscores, play-by-play, shots, and standings
are stored in their corresponding `official_*` tables with season IDs and raw JSON payloads.
Round-level player totals are materialized locally; provider leader/all-time endpoints are neither
called nor persisted.

Team mappings first reuse an existing exact legacy code, then require an exact normalized name.
Player mappings first reuse an exact legacy player code, then require exact normalized name inside
the mapped official team. Fuzzy results are report-only suggestions. Unresolved players remain in
official storage with `review_required` and do not enter `player_round_stats`.

## Live and final behavior

At most two games are processed concurrently. Live events and shots are upserted without deleting
temporarily absent rows. A finished game is replaced transactionally and receives a checksum and
`finalized_at`. Daily sync rechecks finals for 48 hours, replacing only a changed checksum; older
games require `--force-game=<code>`.

The API's current individual/non-commercial terms must be reviewed before any commercial use.
