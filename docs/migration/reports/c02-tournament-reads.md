---
title: C02 Tournament read migration
description: Source contracts and baseline evidence for completing Tournament analytics and presentation ownership.
audience:
  - maintainer
  - agent
status: active
---

# C02 Tournament read migration

Current integration checkpoint (2026-09-20): **MERGED**, PR #35, `73402fc6`.
Deployment was not reverified by this documentation update. Use the [master tracker](../tracker.md)
for remaining work and current task IDs. Original baselines, counts and pre-merge states below
are historical acceptance evidence, not new test results or active assignments.

## Original receipt (historical)

Source baseline: `c9d6a816`, campaign branch `refactor/architecture-completion`.
**IMPLEMENTED AND VERIFIED at e14fe39aa3e8a572da93f35462d911f631d3ff97.**
Integrated on main via PR #35 (`integration/tournaments-migration`). Earlier checkpoint sections below are historical evidence, not current blockers.

## Accepted read-slice scope

All three route families now use feature screen-model services: /tournaments, /tournaments/[id],
and /tournaments/[id]/[section] (standings, bracket, results). Pages receive finished typed
presentation models rather than internal snapshots. Services preserve parallel read ordering,
phone early returns, null/not-found differences, permissive IDs, independent season resolution,
existing authentication boundaries and no-server-cache behavior. No HTTP endpoint was added.

Query ownership, mapper/statistics/bracket calculations, screen orchestration, models and desktop/phone
components belong to features/tournaments. Manager Profile participation remains on its deliberate
server/public contract. The active-round policy uses Rounds/server; there are no foreign deep imports.
The obsolete global services, query adapter and unused card are removed with consumer checks.
Sync writes remain C12 infrastructure, not an unfinished Tournament read implementation.

Final validation on unchanged application source:

- Focused Tournament suite: 226 tests PASS across 16 files.
- npm run verify: PASS (skills, architecture: 822 modules/48 protected entrypoints, docs,
  typecheck, 1507 full-suite tests plus one existing skip, lint, production build,
  schema metadata/Drizzle checks and diff check).
- Lint: zero errors, 24 existing image warnings. Expected missing-provider build warnings only.
- npm run test:e2e:local -- tests/e2e/tournaments.spec.ts --project=iphone-13
  --project=desktop-1440: two tests PASS in 49.7 seconds, original screenshots unchanged.
  Catalogue, league, cup and all phone sections are covered. Disposable database/app shutdown passed.

The first focused run exposed a stale statistics test mock after expanding the server barrel.
Its import now targets the statistics service under test; the final runs above passed. No production
workaround, weakened assertion or error filter was introduced.

Remaining campaign work is explicit: C14 covers inventory refresh, the full viewport suite and
original Linux visual references; C15 covers authorized integration/deployment and production review.
These are not claimed complete by this local C02 acceptance. Next implementation package: C03 Predictions.

## Original flow and compatibility (historical baseline)

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

## Phone catalogue projection

The phone catalogue now receives explicit id/name/type/winnerLabel items, not the complete stored
snapshot or an any-based model. The server contract exposes a pure allowlisting projection of the
already retrieved lists, so query ordering/counts, season resolution and cache behavior are unchanged.
Active rows never inspect winner names. Finished rows preserve the original truthiness and template
interpolation (including arrays, scalar values and ordinary objects); unused icon/round/config fields
are ignored. A consumed object with an invalid toString retains its previous TypeError rather than
being silently repaired. No new validation policy was introduced.

Mapper tests cover field exclusion, JSON serialization, historical roots, unused malformed fields,
order, duplicates, empty lists and legacy conversion errors. Page contracts verify projection on the
phone path only and preserve the desktop statistics read. Desktop catalogue/detail snapshot
projections and final full/browser acceptance remain open.

## Pinned accumulated checkpoint verification

Application source was held unchanged at fdf7ea345ba26213a66243e018d5ddb3c96ee7ef throughout:

- npm run verify: PASS. Skills, documentation (86 notes), architecture (815 modules,
  48 protected entrypoints), typecheck, full tests (1388 passed, one existing skip), lint,
  database-disabled production build, schema metadata (38 tables without drift),
  Drizzle consistency and diff checks all passed.
- Lint: 24 existing image warnings, zero errors. Build: expected absent provider configuration
  warnings; no new warning category observed.
- npm run test:e2e:local -- tests/e2e/tournaments.spec.ts --project=iphone-13
  --project=desktop-1440: PASS, two tests in 47.8 seconds. Original macOS screenshots remained
  unchanged. Catalogue, league, cup and phone section navigation passed with existing error guards.
  The disposable synthetic database and local application shut down successfully.

This supersedes the earlier overlapping-source diagnostic verification for the implemented range,
not the C02 completion status. Desktop/detail winner models, bracket phase/scoring projection and
remaining snapshot typing still require implementation and another final acceptance run.
No production operations, push, configuration changes or snapshot updates were performed.

## Phone detail projection

The phone detail service projection now allowlists id/name/type/status and a winner display model.
The screen no longer accepts Record<string, any> or the stored snapshot. Unused icon, rounds and
configuration fields are not inspected. A zero winner still renders zero through the historical
short-circuit expression. Scalar/array name rendering is retained; ordinary object children that
already failed React rendering stay on the error path. Missing name values project to null, which
renders identically. Render-based tests compare these cases against React's former expression.

MobileBackHeader's title annotation now admits the existing runtime null name; no JSX changed there.
Page tests preserve phone-only projection and the unchanged desktop read path.
Typecheck, architecture (817 modules, 48 entrypoints), focused tests and diff checks pass.
Full/browser evidence above covers the preceding commit, not this new checkpoint. C02 remains open.

## Desktop catalogue projection

Desktop catalogue items now expose id/name/type/status, the existing status label and a winner
display projection (name and resolved icon URL). Neither DesktopTournamentsScreen nor TournamentRow
receives the stored snapshot. The list service projection runs after the existing statistics read;
phone requests still skip both desktop operations. Active rows ignore winner fields, while finished
rows ignore currentPhase. This preserves conditional access to malformed unused fields.

Both phone and desktop mappers share feature-private JSON property/text helpers. No global utility
or foreign-feature dependency was introduced. Truthy non-string icons and non-renderable text objects
remain errors, while existing falsy values, array text, URL casing, ordering and duplicate rows remain
compatible. Query/season/cache behavior and JSX styling are unchanged.

Validation: typecheck PASS; architecture PASS (818 modules, 48 protected entrypoints);
Tournament suite PASS (163 tests, 12 files); diff check PASS. Architecture guards additionally reject
raw snapshot access in the migrated catalogue screen/row. Full/browser acceptance must be repeated
after the remaining desktop-detail winner and bracket snapshot work is implemented.

## Desktop detail and bracket projection

Desktop detail now receives a typed winner/name/status projection; it no longer reads snapshot JSON.
Winner links preserve the original id-or-name interpolation, icon prefix handling and falsy banner
behavior. Active tournaments do not inspect unused winner fields.

Bracket phase lookup, grouping, two-leg aggregation, byes, tie winners, null arithmetic and match
ordering now run in a pure typed server mapper. The client receives only round labels and allowlisted
match display fields; it retains layout, connectors and animation. League/phone paths skip the
bracket calculation. The original query mapper never projected order_index, so that always-zero
sort term is removed; lexical ID ordering remains. No snapshot, raw fixture spread or internal
phase fixture collection crosses the bracket client boundary.

A frozen test-only calculation from 8062ccdd is the compatibility oracle: 100 deterministic fixture
sets across four leg-rule combinations (400 comparisons), plus explicit fallback/error cases,
preserve existing results. Additional tests cover desktop winner links, display values, ignored
malformed fields, serialization and page call boundaries. Architecture guards prohibit snapshot
interpretation/scoring in the bracket client and snapshot props in desktop detail.

Validation on unchanged application source:

- Typecheck, architecture (820 modules/48 protected entrypoints) and focused Tournament tests:
  PASS (199 tests in 14 files).
- npm run verify: PASS, including 1479 full-suite tests plus one existing skip, skills, docs,
  lint (24 existing image warnings), production build, schema metadata (38 tables/no drift),
  Drizzle consistency and diff check. Expected missing-provider configuration warnings remain.
- npm run test:e2e:local -- tests/e2e/tournaments.spec.ts --project=iphone-13
  --project=desktop-1440: PASS, two tests in 49.7 seconds, original screenshots unchanged.
  Disposable database/application shutdown completed.

C02 is still open: statistics snapshot typing and final export/contract reconciliation remain.
No push, deployment, production operation, schema/configuration change or visual redesign occurred.

## Statistics winner contract and export audit

Removed the unchecked WinnerSnapshot assertion. Hall of Fame now reads each consumed field explicitly,
normalizes non-string/number identities to their existing grouping key, and carries an explicit href
so unusual truthy IDs (including empty arrays) retain their original link. Renderable name arrays/scalars
remain supported; icon and palette values retain existing display behavior. Duplicate winner details
are not inspected after the first occurrence, and standings colors still override snapshot colors.
The finished-only legacy top-level winner fallback remains explicitly typed without a cast.

Tests cover identity/link coercion, falsy IDs, numeric palette coercion, duplicate-field skipping,
renderable names, omitted fields and previously failing consumed values. Focused Tournament suite:
222 tests PASS; typecheck, architecture (820 modules/48 protected entrypoints) and diff checks PASS.
The HallOfFame href is an internal presentation field, not a new HTTP response field.

Removed the unused getTournamentPlayoffRules service wrapper after consumer search; the bracket service
uses the mapper directly. Removed internal Tournament, TournamentJson and ManagerTournamentRead exports
from public.ts; consumers use their explicit presentation/participation contracts instead.

Closure audit still requires consolidating page-level read/projection orchestration into screen-model
services: catalogue/detail pages currently see internal read snapshots before calling projections.
Then reconcile the C02 inventory/receipt and rerun final full/browser checks. Do not mark C02 complete
based solely on the earlier bracket validation.
