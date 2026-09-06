---
title: Architecture migration status
description: Evidence ledger for incremental domain and HTTP boundary migrations.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Architecture migration status

## Verified starting point — 2026-09-05

- Local and fetched remote main: `a9f0dc929fd08df5a35e2a690b4859762afa7ad8`.
- Matches and Team Profile are integrated. Vercel reports production deployment
  `dpl_4x574BXXGf882revQKAa9YVCMs8S` READY at the same main SHA.
- Players is unpublished at `5c546983` on `refactor/players-feature-architecture`.
- Slice 1: `fix/session-read-cache-policy`, based on the main SHA above.
- No architecture-objective deployment has occurred yet.

## Domain ledger

| Domains                                                  | Status / next boundary                                                              |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Matches, Teams                                           | Integrated; official DTOs, persistence guards and graph enforcement need refinement |
| Players                                                  | Pending integration after cache correction; manager adapter is temporary            |
| Rounds                                                   | Calendar foundation, then historical results and analysis                           |
| Managers                                                 | Profile, directory and squads remain legacy                                         |
| Standings                                                | Base rankings, performance analytics and draft analytics are separate slices        |
| Tournaments                                              | Legacy read services and components                                                 |
| Predictions, Playoffs                                    | Legacy scoring/read services; preserve distinct formulas                            |
| Schedule                                                 | Map uses Matches; squad overlay remains legacy                                      |
| Market public reads                                      | Legacy analytics; separate from private operations                                  |
| Dashboard, Compare                                       | Legacy composition; migrate after owning read contracts                             |
| Home, News, Search                                       | Existing partial layers; migrate contracts and screens                              |
| Season Review                                            | Existing pure engine and artifact readers; feature boundary pending                 |
| Hoopgrid                                                 | Security gate: challenge creation in GET and mixed private response                 |
| Lineup, Market operations                                | Deferred pending provider-operation security gate                                   |
| Accounts, Settings                                       | Deferred pending credential observation gate                                        |
| Assistant                                                | Deferred pending privacy/provider review                                            |
| Shell, shared UI                                         | Structural ownership pass after domains; no redesign                                |
| Login protocol, PWA utility routes, framework boundaries | Infrastructure; no artificial feature required                                      |

## HTTP contracts and compatibility

No routes are renamed in Slice 1. All seven session-fallback success responses
must become `private, no-store, max-age=0, must-revalidate`, including explicit-ID
requests. Identity precedence, malformed-input quirks and envelopes stay unchanged.

| Current route                             | Proposed canonical resource (not implemented) | Owner                |
| ----------------------------------------- | --------------------------------------------- | -------------------- |
| `/api/player/rounds?userId=X`             | `/api/managers/X/rounds`                      | Managers / Rounds    |
| `/api/player/stats?userId=X`              | `/api/managers/X/stats`                       | Managers             |
| `/api/player/squad?userId=X`              | `/api/managers/X/squad`                       | Managers             |
| `/api/dashboard/captain-stats?userId=X`   | `/api/managers/X/captain-stats`               | Managers / Rounds    |
| `/api/dashboard/captain-suggest?userId=X` | `/api/managers/X/captain-recommendations`     | Managers preparation |
| `/api/dashboard/home-away?userId=X`       | `/api/managers/X/home-away-stats`             | Managers             |
| `/api/dashboard/leader-gap?userId=X`      | `/api/standings/managers/X/leader-gap`        | Standings            |
| `/api/team/X`                             | `/api/teams/X`                                | Teams                |
| `/api/player/streaks`                     | `/api/players/streaks`                        | Players              |
| `/api/users`                              | `/api/managers`                               | Managers             |

Other routes retain their current names; the existing API inventory is in
[Internal API](../reference/internal-api.md). Canonical aliases require demonstrated
consumers or architectural benefit. Legacy routes remain tested adapters; removal
requires approval or reliable usage evidence. No alias has been added by this objective.

## Dependency decisions

- Teams consumes Matches through its server contract.
- Pending Player Profile consumes Team metrics/upcoming-match contracts.
- Player catalogue/form must not depend on Player Profile orchestration: this
  prevents a Team roster / Player Profile cycle.
- Rounds owns current/next/last fantasy-round policy; Matches owns games.
- Managers owns squads; Lineup must retain its existing HTTP contract while the
  legacy Players manager adapter is replaced.
- Dashboard, Home, Compare and Schedule compose owning domain contracts, not SQL.
- Credentials, authentication and synchronization remain protected infrastructure.

## Validation and repository health

- Clean main and Players worktrees confirmed before implementation.
- Fresh dependency install used `npm ci --ignore-scripts --no-audit --no-fund`.
- Baseline schema metadata audit: passed, 38 source/snapshot tables, no drift.
- Baseline `npx drizzle-kit check`: passed; no database connection or migration.
- Baseline typecheck, lint, tests and database-disabled production build: passed.
- Slice 1 validation on 2026-09-06: typecheck passed; focused API tests passed
  (162 tests); full suite passed (678 tests, one existing skip); lint passed with
  the same 29 image warnings; `SKIP_DB=true npm run build` passed. Missing provider
  environment warnings and Node DEP0205 were also present in the baseline.
- Schema metadata audit and Drizzle check passed again (38 tables, no drift).
- Production dependency audit reported zero vulnerabilities; `git diff --check`
  and formatting checks on the new test and ledger passed.
- New regression matrix: 140 tests using real route handlers, identity resolver
  and response helpers. Before the correction, 70 failed on public success headers;
  after the correction all passed. Authentication and data reads are mocked.
- Baseline `npm run docs:check`: fails on two stale Team source links in
  `docs/product/players-and-teams.md`.
- Existing main CI run `33683750294`: documentation failure and formatting debt
  in 60 files. Repair separately; do not mix mass formatting with domain work.
- Formatting cleanup explicitly approved on 2026-09-06 and completed in four
  separate commits: `c0a53c79` route adapters, `9c342593` mobile screens,
  `5dd6994a` shared presentation/helpers, `450ee236` Matches. All 60 files match
  Prettier output from their original source. Normalized emitted JavaScript is
  identical in 59 files; the remaining Lineup change only splits the save-button
  label into adjacent text children with identical text. No CI checks were changed.
- Formatting-only validation: typecheck, lint (29 existing warnings), production
  build, schema metadata, Drizzle and diff checks passed. An overloaded concurrent
  test run failed with timeouts and a subsequent assertion failure; an isolated
  full run with two workers passed all 538 tests (one existing skip). No timeout
  configuration or tests were changed.
- The separate Team documentation-link correction was rebased as `b97ef625`.
  Maintenance and cache branches rebased without conflicts; Players remains untouched.
- Combined branch: the default-worker full suite passed 678 tests (one existing
  skip); docs check passed all 49 notes; typecheck, production dependency audit
  (zero findings), schema metadata and Drizzle checks passed again.

## Next gate

Finish combined validation, independently integrate/deploy Slice 1,
then verify production SHA and safe responses/logs. Only afterwards rebase Players.
The full migration objective remains incomplete. Protected pages, credentials,
fallback configuration, database schema and provider operations are unchanged.
