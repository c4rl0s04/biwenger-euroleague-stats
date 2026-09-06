---
title: Managers read foundation
description: Bounded ownership migration for manager statistics, current squads and recent rounds.
audience:
  - contributor
  - maintainer
status: active
---

# Managers read foundation

Branch: `refactor/managers-read-architecture`, based on `832b4c75`.
This is the statistical read foundation, **not** the complete Manager Profile migration.

## Ownership and compatibility

- Existing `/api/player/stats`, `/api/player/squad` and `/api/player/rounds`
  now invoke Managers services directly. No URL, response envelope, identity precedence,
  status/error behavior, logging or cache header changes.
- Manager Profile, Dashboard, Assistant and the existing Lineup section keep legacy
  query/service adapters, now backed by the same Managers implementation. No screens,
  mutations, account data, credentials or authentication logic move.
- Managers owns season-statistics, current-squad and manager round-participation queries,
  independent typed serializable models, explicit allowlisting mappers and sequential
  orchestration. The obsolete Players manager wrapper and its inaccurately narrow types
  are removed. Players no longer depends on Managers.
- Managers consumes Players' deliberate recent-scores contract and Standings'
  `getSimpleStandings` contract. The latter lands in the same integration batch.
  The existing shared player-form SQL remains a single legacy implementation behind the
  Players query adapter until its other analytics consumers migrate.

## Preserved details

HTTP identity is still resolved and validated by `getRequestUserId` at the edge.
Internal string/number IDs are forwarded exactly; malformed page IDs are not silently
normalized or rejected with a new status. Manager-not-found remains the existing
`Desconocido` statistics sentinel. Recent rounds still default to 100.

Reads remain uncached. Each original season resolution remains in place. Squad ordering
is query, player form (five rounds), same-season competition points, then standings.
Statistics retain sequential identity, totals, positions, conditional transfers and
standings reads. Unknown managers still skip transfer reads.

The HTTP field names and legacy numeric-string/null representations remain intentional:
squad aggregate points may be a string; player prices, points and averages are not newly
coerced; top-falling uses the original last-seven/reverse behavior. Stats aggregates and
round points/positions retain their original conversions. Transfer dates are normalized
to ISO strings with identical JSON serialization. The only presentation consumer of
transfer dates constructs `new Date(tr.fecha)`; no direct Date-method consumer was found.

## Verification and remaining work

Baseline: typecheck and 179 focused tests passed. The standalone migration has 193
passing focused query/mapper/boundary/Players/HTTP/cache tests. The service and full-chain
HTTP tests, final typecheck and graph verification require the concurrent Standings
contract and integration's shared database-barrel cycle corrections.

The integration coordinator runs the full sequential verification and production
checks; this branch is not independently deployable before those dependencies land.
Scoped ESLint and `git diff --check` passed. No browser screen was moved in this slice.
Authenticated desktop/mobile visual review remains required for a future presentation move.

The integration policy must register the three retained HTTP routes and remove the
obsolete Players-to-userService exception. Manager directory, contributors, tournaments,
profile screens, captain analytics and other manager projections remain separate work.
