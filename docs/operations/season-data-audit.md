---
title: Season Data Audit
description: Findings and coverage audit from read-only inspection of the isolated historical season snapshot.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Historical season data audit

Date: 2026-09-13. Read-only inspection of the isolated `season_audit` database described in `season-data-copy-receipt.md`. Findings concern the copied snapshot, not a continuously verified production state. No data corrections or schema migrations have been applied.

## Coverage and preservation findings

- Seasons: 2025-26 frozen; 2026-27 active. Player and manager seasonal records currently exist only for 2025-26.
- All 366 global players have a seasonal row. Points, appearances, home/away splits, previous-season points, owner, team, price, status and price increment match their global counterparts exactly. No seasonal points are null.
- Position exists globally for 366 players; jersey number for 364. These fields have no seasonal destination yet. Their global values are evidence of the snapshot, not verified effective-date history.
- All seven managers have seasonal rows. Names, icons and colors match their current identities. Their seasonal participation status is active even though the season is frozen; participation and season lifecycle are distinct.
- 8,767 player-round records; all have fantasy points, 8,474 have sporting points. The new official-game, official-player-game and official mapping tables contain zero rows. Preserve legacy sporting history; it cannot currently be rebuilt from the new provider tables.
- 403 historical matches, none linked by official game code. All reference existing teams; 20 teams participate.
- 364 legacy player mappings match the corresponding global provider codes exactly. These mappings remain useful historical evidence.

## Discrepancies requiring resolution before destructive migration

1. Of 366 seasonal players, 37 have no round records and zero season points. Another 54 have nonempty round histories whose fantasy-point sums differ from their stored season totals: 53 have higher round sums and one a lower sum. Across the 366 seasonal players, stored totals minus round sums is -1,445. Do not overwrite either representation until round/phase inclusion, provider corrections and summary definitions are established.
2. Fourteen round-stat rows reference six player IDs absent from both global and seasonal identities. Preserve the rows; recover identities from existing source evidence or retain an explicitly unresolved identity strategy. Do not delete them to satisfy a foreign key. These rows are excluded from the 366-player aggregate comparison above.
3. One player-season team reference is `0`, with no matching team. Treat it as a possible provider sentinel, not a confirmed real team. Establish semantics before mapping to null.
4. All 315 manager-round rows have embedded lineup data in addition to the normalized lineup table. Content equivalence is not yet audited; neither representation is safe to retire.

## Relationship checks passed

- No manager-round rows lacking manager-season membership.
- No lineup rows lacking player-season or manager-season membership.
- No bids referencing a missing or different-season transfer.
- No matches referencing missing teams.

These are bounded checks, not an exhaustive certification of every foreign-key candidate.

## Next work

Investigate the 54 total mismatches and six missing player identities using the copy and existing repository/provider provenance, without live provider mutations. Compare embedded and normalized lineups. Inventory remaining seasonal tables and nullable/duplicate relationship keys before proposing constraints. Preserve all legacy source fields until each has a documented destination or justified retention rule. A full Supabase-compatible restore rehearsal remains outstanding.
