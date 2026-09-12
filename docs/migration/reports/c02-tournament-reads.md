---
title: C02 Tournament read migration
description: Source contracts and baseline evidence for completing Tournament analytics and presentation ownership.
audience:
  - maintainer
  - agent
status: active
---

# C02 Tournament read migration

Source baseline: `c9d6a816`, campaign branch `refactor/architecture-completion`.
**IN PROGRESS: statistics extraction implemented; presentation migration and full acceptance pending.**

## Actual flow and compatibility

| Entry                       | Existing behavior                                                                                            | Required ownership                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| /tournaments                | List and phone detection in parallel; phone returns without statistics; desktop then reads global statistics | Feature catalogue service and separate desktop/mobile screens |
| /tournaments/[id]           | Detail and phone detection in parallel; absent detail invokes notFound; then standings/fixtures in parallel  | Feature detail orchestration, preserving query/error order    |
| /tournaments/[id]/[section] | requireMobileRoute first; detail/standings/fixtures in parallel; absent detail returns null                  | Thin route adapter and feature section screen/service         |

Recognized phone sections are standings, bracket and results. Desktop section URLs redirect through
the existing mobile route registry; unknown sections invoke notFound before reads. Bracket and results
both use fixtures in the existing generic phone record list. Do not redesign that difference from desktop.

Detail is force-dynamic. List/sections inherit framework behavior and read phone presentation; no new
route cache declaration is authorized. Services have no server cache. Query layers resolve season for
each read. These routes rely on existing app/proxy authentication; no new HTTP endpoint is needed.
IDs retain Number coercion, including exponent/hex/whitespace and fixture zero/null distinctions.

Desktop active details resolve active_or_next through the legacy DB barrel; replace that call with the
deliberate Rounds server contract. Finished desktop details select the largest fixture round ID. Phones
skip this round lookup. Do not replace this with date order or introduce a phone-only database read.

## Ownership inventory

- Existing Tournament query/read service/mapper owns list, detail, standings, fixtures and Manager
  participation. Reuse those SQL implementations and keep Manager Profile output unchanged.
- Legacy statsService has one exported function, getGlobalTournamentStats, consumed by the desktop
  catalogue through its direct import and re-exported by the global service barrel. It combines all
  tournaments, fixtures and standings concurrently, without caching. Move its calculation into a typed
  feature mapper/engine and its orchestration into a feature service, not a second SQL implementation.
- Components under components/tournaments include cards/rows, active sections, standings, fixtures,
  bracket and statistics cards/tables. Trace zero consumers before deleting any unused export.
- MobileTournamentsScreen and MobileTournamentDetailScreen expose Record<string, any>; replace those
  boundary types with owned projections when moving the screens. The current TournamentJson snapshot
  and data_json forwarding also require explicit presentation projections, not merely new imports.
- Existing tournamentService keeps an inaccurate non-null name assertion for the section page.
  Remove that adapter only after adapting the actual nullable presentation contract.
- Sync tournament writes remain infrastructure/C12, not part of this read migration.

## Baseline tests and remaining evidence

New tournament-statistics.contract.test.ts runs the unmodified global service with synthetic reads.
Nine cases cover empty/all-source reads/no memoization; snapshot winner and color precedence;
chronological scoring/streaks; tie record selection; text IDs; bye/unscored exclusions; finished null
and partially scored behavior; five-game form truncation; league-only/null aggregation; all three errors.
Tournament focused baseline: 37 tests across four files PASS. Typecheck runs separately.

Existing browser fixtures contain Profile league/cup rows but no Tournament-specific screen assertions
or screenshot baseline. Add those against unchanged source before moving presentation. Keep the current
Managers browser process separate: its frozen build cannot validate future Tournament edits.

Next: capture Tournament screen/route baselines, move typed statistics orchestration/calculation,
introduce presentation projections, migrate screens/pages and round policy, register entrypoints,
remove confirmed obsolete adapters, then full acceptance. No UI, scoring, API, auth, schema or provider
behavior change is authorized as incidental cleanup. This package is not VERIFIED.

## Statistics extraction checkpoint

The global calculation now lives in tournament-statistics.mapper.ts, with explicit statistics models
and tournament-statistics.service.ts orchestrating the existing read services. The old statsService
is a compatibility export only. Its former DB imports already delegated to those same feature reads;
no SQL, season resolution, parallelism or caching changed. Screens remain untouched.

The original calculation tests now exercise the legacy alias through the feature service and mapper;
only their data-read mock location changed. Tournament/Managers focused run: 151 tests PASS; added
statistics architecture assertions separately PASS (2 tests). Typecheck PASS, architecture PASS
(809 modules, 45 protected entrypoints). A temporary read-only differential harness compared serialized
results for 100 deterministic synthetic fixture sets against c9d6a816: all matched, including null
scores/counters/manager IDs, byes, chronological ordering and streaks. This is additional bounded
evidence, not a replacement for final UI or full verification.

Snapshot winner typing is still an internal compatibility assertion over heterogeneous persisted JSON.
Complete its presentation projection/validation with the screen migration; do not claim all public
snapshot boundaries are closed yet. Fixture record projections reuse the existing allowlisted feature
models. Required full acceptance and original Tournament visual references remain pending.
