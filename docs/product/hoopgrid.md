---
title: Hoopgrid
description: Daily EuroLeague trivia generation, guesses, rarity, and diagnostic views.
audience:
  - user
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Hoopgrid

Hoopgrid is a daily grid game where a player must satisfy both the row and column criteria of a
cell. Correct-guess frequency across users contributes to rarity scoring.

## Routes

- `/hoopgrid` is the supported game page.
- `/hoopgrid-cheatsheet` is an authenticated inspection view for challenge criteria and candidate
  players.
- `/test-hoopgrid` is a diagnostic page and is not part of the supported end-user navigation.

## Implementation map

- UI: [`src/components/hoopgrid`](../../src/components/hoopgrid) and
  [`src/hooks/hoopgrid`](../../src/hooks/hoopgrid).
- Service: [`hoopgridService.ts`](../../src/lib/services/features/hoopgridService.ts).
- Criteria: [`hoopgridCriteria.ts`](../../src/lib/constants/hoopgridCriteria.ts).
- HTTP: `/api/hoopgrid/today`, `/api/hoopgrid/guess`, and `/api/hoopgrid/list`.
- Data: challenges and guesses in [`schema.ts`](../../src/lib/db/schema.ts).
- Support scripts: [`src/scripts/hoopgrid`](../../src/scripts/hoopgrid) and the recount utility under
  [`scripts/dev`](../../scripts/dev).

## Lifecycle

Challenges are resolved by date. If the requested daily challenge does not exist, the service can
generate it from eligible local player data. Guess recording updates aggregate popularity used for
rarity. Generation therefore depends on sufficiently complete synchronized player/team/history data
even though it is triggered on demand rather than as one of the 15 normal sync steps.

Concurrent creation, repeated guesses, timezone boundaries, and challenges with no valid candidate
must be treated explicitly. Use Europe/Madrid product expectations only where the implementation
does so; stored challenge dates remain the contract.
