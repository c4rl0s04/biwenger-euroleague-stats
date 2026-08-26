---
title: Data Model Reference
description: Ownership and purpose of PostgreSQL table families defined by the Drizzle schema.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Data model reference

[`src/lib/db/schema.ts`](../../src/lib/db/schema.ts) is the application schema source of truth. This
page groups tables by responsibility; inspect the schema before relying on exact column names,
constraints, or indexes.

## Core identities and seasons

| Tables                                               | Responsibility                                               |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| `seasons`                                            | Lifecycle state and provider binding for one fantasy season. |
| `users`, `teams`, `players`                          | Cross-feature identities synchronized from providers.        |
| `user_seasons`, `player_seasons`                     | Season-specific user and player attributes.                  |
| `player_mappings`                                    | Historical global EuroLeague links (read-only fallback).     |
| `official_team_mappings`, `official_player_mappings` | Season-scoped official identity links and review state.      |

## Competition and performance

| Tables                                    | Responsibility                                                    |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `matches`                                 | Official schedule, participants, status, and results.             |
| `user_rounds`                             | Manager points and placement by round/season.                     |
| `lineups`                                 | Historical selected players, roles, and fantasy results.          |
| `player_round_stats`                      | Official/player fantasy performance by round.                     |
| `official_games`                          | Canonical official schedule, score, metadata, and final checksum. |
| `official_player_game_stats`              | Canonical per-game boxscore rows.                                 |
| `official_play_by_play`, `official_shots` | Granular official event and shot data.                            |
| `official_team_standings`                 | Official team standings snapshots by round.                       |
| `initial_squads`                          | Starting squad snapshot used by draft analytics.                  |

## Market and finance

| Tables            | Responsibility                                                      |
| ----------------- | ------------------------------------------------------------------- |
| `fichajes`        | Completed transfer history.                                         |
| `transfer_bids`   | Auction bid history.                                                |
| `market_values`   | Durable player price history.                                       |
| `market_listings` | Current/listing snapshots captured by the rollover-aware sync step. |
| `finances`        | Manager financial events.                                           |

`players.price` is a current cache, not the price-history source. See
[database safety](../operations/database-safety.md) for auditing and repair.

## Tournaments and predictions

| Tables                                                         | Responsibility                                 |
| -------------------------------------------------------------- | ---------------------------------------------- |
| `tournaments`, `tournament_phases`                             | Competition identity and phase structure.      |
| `tournament_fixtures`, `tournament_standings`                  | Tournament matches and rankings.               |
| `porras`                                                       | Synchronized Biwenger prediction-pool records. |
| `playoff_predictions`, `playoff_results`, `user_playoff_media` | Custom playoff feature state.                  |

## Interactive features and metadata

| Tables                                          | Responsibility                                          |
| ----------------------------------------------- | ------------------------------------------------------- |
| `hoopgrid_challenges`, `hoopgrid_guesses`       | Daily grid definition, guesses, and rarity source data. |
| `assistant_conversations`, `assistant_messages` | User-owned assistant history.                           |
| `sync_meta`                                     | Synchronization metadata used by ingestion tooling.     |

## Write ownership

Normal application writes use modules under [`src/lib/db/mutations`](../../src/lib/db/mutations).
The sync pipeline owns provider-derived season facts. Account, assistant, market action, and
Hoopgrid routes own their user-triggered records. All write paths must retain season and user
isolation appropriate to the table.
