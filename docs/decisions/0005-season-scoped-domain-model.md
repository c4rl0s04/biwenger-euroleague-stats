---
title: 'ADR-0005: Season-scoped Domain Model'
description: Decision to separate durable identities from state and relationships that vary by season.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# ADR-0005: Season-scoped domain model

- **Status:** accepted
- **Date:** 2026-09-15
- **Supersedes:** none

## Context

The original schema treated many player, team, and manager attributes as if they were globally
current. That works for one active competition but becomes unsafe when historical seasons must remain
queryable while a new season is synchronized. Team membership, player price, ownership, manager
presentation, venue information, and similar values can legitimately differ between seasons.

Keeping those values on global identity rows would either rewrite history or require fallback logic
that makes it unclear which season a read represents. Seasonal facts also need database constraints
that prevent a user, player, or team relationship from silently crossing season boundaries.

## Decision

Keep `users`, `players`, and `teams` as durable cross-season identities. Store season-varying state in
`user_seasons`, `player_seasons`, and `team_seasons`, and require season-derived facts to carry their
season identity explicitly.

`user_seasons` uses `(season_id, user_id)` as its primary identity. Tables whose manager relationship
is season-dependent use composite foreign keys to that pair. Application queries read seasonal state
directly and do not fall back to deprecated season-varying columns on the global identity tables.

Provider synchronization, repair tooling, and new data access must preserve the same separation.

## Consequences

Historical seasons can remain frozen while the active season evolves, and database constraints catch
more cross-season relationship errors before they reach application code. Queries must now resolve
season context deliberately, which adds some joins and makes legacy single-season assumptions
invalid.

Migration work must remove old fallback reads before dropping deprecated columns. New features should
not copy season-varying attributes back onto global identity rows for convenience.

## Alternatives considered

- Keep mutable season values on `users`, `players`, and `teams`: simpler reads, but updating the active
  season would overwrite historical meaning.
- Duplicate complete user/player/team identities for every season: strong isolation, but loses durable
  identity and complicates cross-season analysis and provider mapping.
- Keep both global current values and seasonal snapshots with read fallbacks: eases migration, but
  creates two competing sources of truth and was retained only as temporary migration behavior.
