---
title: Players and Teams
description: Player discovery, player profiles, team profiles, and their data contracts.
audience:
  - user
  - contributor
  - maintainer
  - agent
status: active
---

# Players and teams

## Routes and behavior

- `/players` supports player discovery, filtering, squad-oriented summaries, and navigation to
  profiles.
- `/player/[id]` combines player identity, market value, status, performance, round history, and
  squad context.
- `/team/[id]` presents the real EuroLeague team's profile and associated player/match information.

The global search endpoint also links users into player, team, and manager destinations.

## Implementation map

- Pages: [`players`](<../../src/app/(app)/players>), [`player/[id]`](<../../src/app/(app)/player/[id]>),
  and [`team/[id]`](<../../src/app/(app)/team/[id]>).
- UI: [`players-list`](../../src/components/players-list),
  [`player-profile`](../../src/components/player-profile), and [`team`](../../src/components/team).
- Services: [`playerService.ts`](../../src/lib/services/core/playerService.ts),
  [`teamService.ts`](../../src/lib/services/core/teamService.ts), and
  [`searchService.ts`](../../src/lib/services/features/searchService.ts).
- Data: core player/team queries and player-form queries under
  [`src/lib/db/queries/core`](../../src/lib/db/queries/core).
- HTTP: `/api/player/*`, `/api/players/[id]/stats`, `/api/team/[id]`, `/api/search`, and
  `/api/stats/leaders`.

## Data considerations

Biwenger IDs are the primary application identifiers. EuroLeague identifiers are mapped during
sync for schedules, box scores, teams, and official metadata. Player price is a current-value cache;
historical valuation belongs to market history. Status, images, team assignment, and statistics can
arrive from different provider steps and should tolerate temporary gaps.
