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

## Original browser reference preparation

Reference branch/worktree: chore/tournament-visual-baseline in
../biwengerstats-next-tournament-visual-baseline, pinned to 11c78c0e (pre-extraction application).
Only the new Tournament browser test and synthetic fixture additions are applied there. Its isolated
dependency setup passed without lockfile changes. The campaign carries the same test and fixture edits.

The new test covers catalogue, league, finished cup and all three phone sections. Synthetic league
fixtures include a completed and pending game; the cup has a completed final. Existing Profile
participation rows are unchanged. One exact synthetic CDN icon path is served from the local icon;
browser exception and failed-API guards remain unchanged. No production data or provider request is used.

Test/fixture typecheck and targeted ESLint PASS. Original reference capture was launched with
npm run test:e2e:local -- tournaments.spec.ts --project=iphone-13 --project=desktop-1440 --update-snapshots.
Capture and repeat-without-update results are pending. Do not copy or bless incomplete reference
artifacts or move screens before inspecting the results. Linux visual evidence remains part of C14.

Original capture result: desktop PASS; phone reached all screenshots but failed the existing browser
error guard with Auth.js/prefetch load cancellation during full document navigation. References are
not accepted yet. The test now uses real catalogue/section/back links instead of repeated page.goto;
guards and application source remain unchanged in the baseline checkout. A repeat without snapshot
updates is running. If it fails, inspect the actual error rather than blessing the initial images.

## Round policy checkpoint

Tournament detail no longer imports the database barrel. Its new Tournament round service consumes
Rounds/server and preserves active_or_next versus finished maximum-ID selection. The call remains
after the phone early return; no query/cache policy or JSX changed. Four tests cover repeated active
reads, null resolution, nonmutating finished ordering, null/zero ties, empty lists and errors.
Tournament focused suite PASS: 42 tests. Architecture PASS: 810 modules/45 protected entrypoints;
typecheck and diff checks PASS. Full acceptance after this checkpoint remains pending.

The preceding statistics checkpoint a2cb65ec passed full npm run verify: 1,316 tests plus one existing
skip, typecheck, architecture, documentation, lint (25 existing warnings), production build,
38-table metadata audit and Drizzle consistency. That result predates the round-policy change.

## Original references accepted and component ownership checkpoint

The original repeat without snapshot updates passed both iPhone 13 and desktop 1440 tests (44.5s).
Reference commit afb26b3b on chore/tournament-visual-baseline contains only the test, synthetic fixture
additions and 12 macOS screenshots. Application source remains at 11c78c0e. The campaign copies those
images unchanged; no candidate-generated baseline is used. Desktop cup and phone league captures
were visually inspected for populated content. The original navigation failure was resolved using
app links, without weakening error guards or changing application behavior.

Eleven files under components/tournaments were relocated to features/tournaments/components.
A binary content comparison against the pre-move commit passed for every relocated source file.
The two page imports now consume public.ts. No component markup, interaction or calculation changed.
Architecture (810 modules/45 entries), typecheck and diff checks passed. Candidate focused browser
comparison is running without update flags; its outcome and full final acceptance remain pending.

Remaining C02 work is explicit: desktop/mobile screen composition, typed presentation snapshot
projections, section/page contracts, adapter retirement and entrypoint registration. Moving components
alone does not complete this package. No deployment, production data or configuration changes occurred.

Candidate component-move comparison completed: both original iPhone/desktop tests PASS (43.4s),
with unchanged snapshots and error guards. This verifies the component move/round-policy checkpoint,
not later screen extraction.

## Desktop catalogue composition checkpoint

The catalogue page is now a thin TSX adapter calling Tournament server services directly. Its desktop
JSX moved into DesktopTournamentsScreen with typed props; phone composition remains pending. Six page
contract tests exercise real page branching, concurrent list/presentation reads, desktop-only statistics,
prop forwarding and all read failure paths. Tournament suite PASS: 48 tests; typecheck and architecture
PASS (811 modules/45 entries). An AST comparison proves the desktop JSX is unchanged.

The shared Section component had incorrect JSDoc treating its props object as a string. Only that
annotation was corrected so the typed screen can consume it without an unsafe local cast; emitted
JavaScript is identical. No shared component behavior changed. Browser/full acceptance of this latest
checkpoint remains pending, along with the previously listed mobile/detail/model work.

## Detail and mobile composition checkpoint

Both mobile screens now live under features/tournaments/components/screens and use public.ts exports.
Only their shared-component import paths changed; their loose tournament types remain an explicit
projection task, not completed work. The desktop detail JSX moved to DesktopTournamentDetailScreen;
its typed TSX page calls feature services directly, preserving force-dynamic, ID forwarding, read order,
notFound and the phone early return. No legacy service wrapper remains in that detail page.

Nine real detail-page contract tests cover desktop/phone props, all read failures, missing tournaments,
read staging and exact ID forwarding. Combined Tournament suite PASS: 57 tests; typecheck PASS.
Initial JSX test-loader React errors were resolved by making the thin page TSX, not by altering
application runtime or global test configuration. Architecture/diff checks and original-snapshot
browser comparison are run for this checkpoint; full feature acceptance remains pending.

Still required: typed snapshot/presentation projections, mobile section composition and contracts,
adapter/dead-export retirement, entrypoint protection and combined acceptance. No claim of a fully
migrated Tournament boundary is made by these composition moves.

The detail/mobile composition checkpoint passed both iPhone/desktop original-snapshot comparisons
(52.2s), including all phone sections. This precedes the section-service extraction below.

## Section ownership checkpoint

The section page now invokes getTournamentSection after requireMobileRoute and composes the feature's
TournamentSectionScreen. The service preserves concurrent detail/standings/fixtures reads, original
ID forwarding, missing-detail null output and standings versus fixture selection. The section model
only forwards the nullable name and selected existing view-model list, not the tournament snapshot.

MobileDetailScaffold/MobileBackHeader context types now admit null, matching their existing rendering
and nullish-label handling. No JSX or runtime logic changed in these shared components. This removes
the need for the legacy non-null name assertion at this route boundary.

Nine real route/service contract tests cover routing interruption, exact inputs, selected props,
parallelism, absent details and all read errors. Typecheck and architecture PASS (815 modules/45
protected entrypoints). The statistics test's read-service mock was extended for newly imported
section dependencies; statistics assertions were not weakened. Full acceptance remains pending.

All three Tournament page families now compose feature screens; typed snapshot projections, obsolete
adapter/dead-export removal, protection registration and final acceptance are still open.

## Obsolete adapters and route protection

Source/script/test searches found no runtime consumers of tournamentService.ts, statsService.ts or
TournamentCard after page migration. Both service wrappers and their global-barrel exports were
removed, along with the unused card and its component-barrel export. Manager Profile already consumes
fetchUserTournaments from the feature server contract; unrelated similarly named provider/Compare
functions were not changed. Removed files remain recoverable in Git history.

Existing tests now invoke the feature contract directly, preserving all data/coercion/error assertions.
Only obsolete wrapper identity assertions were retired; query-adapter identity tests remain while
those adapters exist. Architecture tests assert the deleted files remain absent.

Focused Tournament/Managers suite PASS: 179 tests; typecheck and diff checks PASS. All three Tournament
routes are registered without exceptions: architecture PASS (812 modules, 48 protected entrypoints).
The already-running broader verify is not final acceptance for this evolving checkpoint; repeat full
verification after the remaining typed projections/query-adapter cleanup. No release is authorized.

## Snapshot projection compatibility checkpoint

The broader verify completed successfully (1,346 tests, one existing skip; production build and
38-table metadata/Drizzle checks PASS). Cleanup edits overlapped its execution, so it is diagnostic
evidence rather than immutable-candidate acceptance. The final exact candidate still needs verification.

Screen snapshot consumers are limited to winner identity/name/icon, currentPhase, playoff leg flags
(both camel-case and lower-case spellings), and round-name/type fallbacks for bracket grouping.
The internal read contract deliberately accepts scalar, array and object JSON; six additional
characterization cases pin null, false, zero, string, array and unrelated-object preservation.
Presentation projections must be separate from that internal historical contract. Do not introduce
blanket object validation into getTournamentDetails/getAllTournaments to make screen types compile.
The next implementation should allowlist consumed fields and preserve unused/absent field semantics;
it must not merely assert the entire snapshot is a typed screen model.

## Playoff rule projection

The detail page obtains an allowlisted TournamentPlayoffRules model from the feature service; the
bracket receives two booleans instead of reading config.playoff itself. Only literal true enables
either rule, including either historical spelling. Scalars/arrays/null and unknown fields remain
accepted internally and are not forwarded through this projection. The phone path still skips it.

Nineteen mapper cases cover historical roots, both spellings, nonboolean flags, OR precedence and
field exclusion. Tournament suite PASS: 91 tests; typecheck, architecture (814 modules/48 protected
entrypoints) and diff checks PASS. No cast of the full snapshot or new input rejection was introduced.
Winner/current-phase/round-fallback projections remain open, and the bracket still receives the old
tournament model for its remaining fallback lookup. Final browser/full acceptance remains pending.

## Retired query adapter

Removed the unused legacy tournament query module and its global database-barrel re-export.
Repository-wide symbol and import searches found no runtime callers outside the owning feature.
Contract tests now invoke the same feature services directly; only the obsolete adapter-identity
assertion was removed. Season resolution, null/all-tournament reads, malformed JSON, ordering and
error propagation assertions remain. Architecture tests prevent the deleted module returning.
Mobile detail fixture/standing props now use the existing explicit feature models; JSX is unchanged.

Validation: typecheck PASS; architecture PASS (813 modules, 48 protected entrypoints);
focused Tournament tests PASS (90 tests, 9 files); diff check PASS.
This is an implementation checkpoint, not full acceptance. Snapshot presentation projections,
browser comparison and final full verification remain open. The original campaign inventory retains
the deleted path as baseline evidence and must be reconciled during closure.
