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

For current coverage and remaining work, see the [migration overview](migration-overview.md).

## Verified starting point — 2026-09-05

- Local and fetched remote main: `a9f0dc929fd08df5a35e2a690b4859762afa7ad8`.
- Matches and Team Profile are integrated. Vercel reports production deployment
  `dpl_4x574BXXGf882revQKAa9YVCMs8S` READY at the same main SHA.
- Players is unpublished at `5c546983` on `refactor/players-feature-architecture`.
- Slice 1: `fix/session-read-cache-policy`, based on the main SHA above.
- These are historical starting-point SHAs; the completed cache release is recorded below.

## Domain ledger

| Domains                                                  | Status / next boundary                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Matches, Teams                                           | Integrated; official DTOs, server guards and transitive graph enforcement verified |
| Players                                                  | Integrated; manager adapter removed in the read-foundations release                |
| Rounds                                                   | Calendar foundation implemented; historical results and analysis remain legacy     |
| Managers                                                 | Base/contributor reads released; Profile/directory remain legacy                   |
| Standings                                                | Base/head-to-head reads released; remaining analytics/screens remain               |
| Tournaments                                              | Core/participation reads released; analytics/screens remain                        |
| Predictions, Playoffs                                    | Legacy scoring/read services; preserve distinct formulas                           |
| Schedule                                                 | Map uses Matches; squad overlay remains legacy                                     |
| Market public reads                                      | Legacy analytics; separate from private operations                                 |
| Dashboard, Compare                                       | Legacy composition; migrate after owning read contracts                            |
| Home, News, Search                                       | Search read boundary released; Home, News and shell composition remain             |
| Season Review                                            | Existing pure engine and artifact readers; feature boundary pending                |
| Hoopgrid                                                 | Security gate: challenge creation in GET and mixed private response                |
| Lineup, Market operations                                | Deferred pending provider-operation security gate                                  |
| Accounts, Settings                                       | Deferred pending credential observation gate                                       |
| Assistant                                                | Deferred pending privacy/provider review                                           |
| Shell, shared UI                                         | Structural ownership pass after domains; no redesign                               |
| Login protocol, PWA utility routes, framework boundaries | Infrastructure; no artificial feature required                                     |

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
- Player Profile consumes Team metrics/upcoming-match contracts.
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

Slice 1 completed at `376814b6b2ff550cad9f298fa3e405d250458344`: Vercel
`dpl_J82oACGcjZUTHGs4SzJ1Zc3qyR23` READY, matching main; GitHub CI
`34026360593` passed. All seven endpoint success/anonymous/invalid-ID smoke
checks preserved envelopes and exact private/no-store headers. Protected routes
redirected normally; deployment-scoped error/fatal and 5xx queries found no logs.

Players rebase mapping:

- `5ba86e43` → `0d8d859f` (feature boundary).
- `0a2d5fb8` → `77197963` (boundary/contract tests).
- `5c546983` → `9162c3d8` (obsolete component removal).

Straightforward conflicts retained Players services with private HTTP responses
and removed the obsolete mobile screen after consumer checks. The 140-case
session-cache matrix now mocks the deliberate Players service contract.

Compatibility review corrected legacy profile aggregate nulls/decimal strings,
nullable match stats, date serialization and streak count strings. HTTP services
produce explicit allowlisted projections; UI services keep normalized models.
No URL or ID-validation semantics changed. Manager reads still delegate to the
legacy user service until the Managers slice; no duplicate manager queries were added.

Players validation so far: typecheck passed; 179 focused tests passed; full suite
707 passed, one existing skip; documentation/formatting passed; lint passed with
25 existing image warnings; schema metadata/Drizzle passed (38 tables, no drift);
production dependency audit zero findings. Production build passed with baseline
environment/Node warnings. A public production Player profile was replayed through
the new mappers in memory: no JSON value/field differences. This confirmed that
the existing HTTP `profile_url` field must be retained despite its absence from
the local schema declaration; no schema was changed.

Players released at `7712910f08c5d02c485f44c2f22895a42be7469c` by clean
fast-forward and main push. Vercel `dpl_BofXVYwjBW9wWCMfbFoqyoqpoqgi` is READY
on the matching SHA and production alias; GitHub CI `34052043965` passed.
Public profile and streak responses matched the pre-release canonical JSON hashes
exactly. Team and player APIs returned 200; protected Players/Teams/Matches/Dashboard
routes retained login redirects. All seven session-dependent APIs retained exact
private/no-store headers for successful, anonymous and invalid-ID reads. The
deployment-scoped log sample had no error/fatal or 5xx entries and no sensitive-value
patterns. Authenticated desktop/mobile visual verification remains manual.

Reference refinement starts with entrypoint separation: four Players pages now
import screens from the existing client-safe public contract and services from
the server contract. Redundant presentation re-exports are removed from Players
server.ts. AST-based tests guard the three reference server barrels and all four
page import contracts. Baseline: typecheck and 209 focused tests passed. This
bounded sub-slice does not claim complete transitive import-graph enforcement;
independent DTO review, allowlisting and graph enforcement remain next, before
the Rounds foundation.

Entrypoint validation: typecheck passed, 216 focused tests passed and the full
suite passed 714 tests with one existing skip. Lint passed with the same 25 image
warnings after correcting a reserved variable name in the new test. Production
build, documentation check (49 notes), schema metadata (38 tables), Drizzle check
and diff whitespace check passed. AST comparison confirmed all four pages retain
identical non-import logic. No HTTP, database, authentication or component
implementation changed. Released at `22df97bea2a273b159a1e4a65e41ef799cddd33c`:
Vercel `dpl_Apz67RgRqfHt6QXeNn17XKBWnxtu` READY with matching production alias;
CI `34052587483` passed. Public profile/streak JSON hashes still matched baseline,
protected redirects and private cache responses passed, and deployment-scoped
logs contained no error/fatal or 5xx entries or sampled sensitive-value patterns.

## Official-game DTO refinement

Branch `refactor/official-game-contracts` isolates the Matches official-game read
projection. `/api/matches/[id]/play-by-play` and `/api/matches/[id]/shots` retain
their existing routes, filter validation, envelopes, ordering, nulls, snake-case
item fields and error behavior. The query SQL and bound parameters are unchanged.
Public DTOs no longer derive from query return types. An explicit mapper allowlists
every selected field and serializes dates using the same JSON representation as
the previous HTTP response. Query and service modules now have server-only guards.

Access remains public statistical reads selected by URL ID/filters, without
session fallback. Freshness remains 15 seconds live / 3600 finalized, with the
existing 60-second stale-while-revalidate window and private/no-store errors.
No persistent cache or new endpoint is introduced. Synthetic contract tests run
real routes/services/mappers and inject extra fields at the envelope, match and
item levels to verify exclusion. No provider or database operations are performed
by tests. Baseline: typecheck and 16 focused tests passed. After changes: typecheck,
29 focused tests, full suite (727 passed, one existing skip), schema metadata
(38 tables), Drizzle and production dependency audit (zero findings) passed.
Lint passed with 25 existing image warnings; production build passed with known
local-environment/Node warnings. Docs check passed all 49 notes; diff check passed.
Read-only production probes established 400/404 baselines; no safely identified
populated official match was available for a live payload comparison. Successful
payload compatibility is covered by synthetic full-chain tests. Release verification
completed at `48b0bcbb5df8b7f466361376c969463b51e9bc18`: Vercel
`dpl_4q8NZnQwDGdCLxKt6cuP6zGJYAnH` READY on the matching production alias;
GitHub CI `34053450150` passed. Safe HTTP checks retained login redirects,
public read availability and private error/session-read headers. Scoped logs
contained no error/fatal or 5xx entries and no sampled sensitive-value patterns.

## Import-graph enforcement

`chore/feature-graph` adds a test-only TypeScript AST analyzer. The ordinary full
test suite now checks all feature public entrypoints and feature Client Components
through transitive local runtime imports. It follows aliases, relative imports,
re-exports, literal dynamic imports and CommonJS requires, distinguishing type-only
edges. Unresolved/computed client imports fail rather than silently escaping checks.
Tests reject foreign feature deep imports (including type-only imports), server
module/package reachability from client-safe roots, and feature dependency cycles
including edges mediated by legacy/shared modules. No application code is imported
or executed by this analyzer.

Scope is local source under `src`, excluding tests. External package internals are
not traversed; framework builds remain required. Known server paths/packages are
classified conservatively. This is not a proof about arbitrary generated code or
third-party package behavior. Seven synthetic graph cases validate the detector,
and the repository graph is checked separately. Baseline typecheck and 78 feature
tests passed. No application behavior, schema, dependency or configuration changed.
Validation passed: typecheck, 86 focused tests, full suite (735 passed, one existing
skip), lint (25 existing warnings), production build (known local environment/Node
warnings), docs (49 notes), schema metadata (38 tables), Drizzle, production audit
(zero findings) and diff check. The analyzer uses ES5-target-compatible collection
iteration without changing compiler configuration. Released at
`3a4fcc9794d05036ab2f87b7ae364c770877f11c`: Vercel
`dpl_tzn5Zo9KNtXP7wXjwWZxWK8NuAex` READY with matching production alias,
GitHub CI `34053863757` passed, read-only smoke checks passed, and scoped logs
had no error/fatal or 5xx entries or sampled sensitive-value patterns.

## Explicit feature server guards

`refactor/feature-server-guards` adds side-effect `server-only` imports to the
six remaining unguarded query/service modules in Matches, Teams and Players.
All ten current query/service modules are now covered by an AST guard test.
Local unit tests mock the marker only where they import these services directly;
application guards and the source import-graph tests are not weakened. Consumer
inspection found no CLI imports of these internal modules. Pure mappers and types
remain usable without privileged-module side effects. No queries, payloads,
validation, cache policy, UI or provider behavior changed.

Baseline: typecheck and 86 focused tests passed. After changes: typecheck and 97
focused tests passed; lint retained 25 existing warnings; schema metadata (38
tables), Drizzle and production dependency audit (zero findings) passed. A full
suite run concurrent with lint timed out in the graph scan while 745 tests passed;
an isolated default-worker rerun passed all 746 tests (one existing skip) without
changing any timeout or assertion. Production build, docs (49 notes), and diff
check passed. Released at `4cf8446d91eb28dce01786e1d9f40af6b336b173`:
Vercel `dpl_D8BpL3rVvvxcGb9h7pWze5deWB1b` READY on the matching production alias;
GitHub CI `34062607177` passed. Login/session, protected redirects, public reads
and private session-dependent cache headers passed smoke checks. Deployment-scoped
logs had no error/fatal or 5xx entries and no sampled sensitive-value patterns.
The full migration objective remains incomplete. Protected pages, credentials,
fallback configuration, database schema and provider operations are unchanged.

## Round calendar foundation

`refactor/round-calendar` introduces `src/features/rounds` for current/next/last
round chronology only. Its five-field season-scoped projection is distinct from
the richer Matches game/schedule query: Rounds owns round grouping and selection,
while Matches consumes the deliberate Rounds server policy contract. There is no
reverse dependency. The existing shared Drizzle singleton moves unchanged into
`src/lib/db/connection.ts` so new queries do not depend on the legacy query barrel.
The old database index re-exports that same singleton; pool configuration is unchanged.

The feature contains independent serializable calendar models, an allowlisting
date mapper, pure selection policy, a server-only query and an injected service.
Each call resolves the existing season, captures time before querying and rereads
the database. No request memoization or persistent cache is added. This is public
competition chronology without identity input; caller authentication and HTTP
headers are unchanged. No route, section or ID validation is changed, and no new
endpoint is introduced. The policy enum is trusted internal input, not a new
external validation boundary. Unknown runtime policy values still return null.

Legacy `getCurrentRoundState`, `getLastCompletedRound`, `getLastCompletedRoundId`
and `resolveRoundIdByPolicy` remain adapters in the old rounds query module.
They preserve snake_case fields, Date objects for server callers and identical
JSON serialization. This temporary Date projection is not the new feature model.
Home, Dashboard, Schedule, Rounds, Tournaments and Assistant keep their existing
call sites. Postponed/past unfinished matches, null groups/dates, first-match names,
zero-ID truthiness, preseason defaults and the second completed-round snapshot
remain deliberate compatibility behavior rather than opportunistic fixes.

`getRoundDetails`, `getAllRounds`, history, rankings, lineup calculations and all
presentation remain untouched. This is not the complete Rounds migration.
Baseline: typecheck and 107 focused tests passed. New tests cover query projection,
season/order, mapping, policy edge cases, service ordering/freshness/errors and
real-service legacy response compatibility. Typecheck and 62 focused Rounds,
Matches and architecture tests passed. The default-worker full suite had 761
passes and the known five-second graph timeout; a two-worker rerun passed all
762 tests with one existing skip. No timeout or assertion changed. An additional
in-memory comparison of 1,000 deterministic chronological fixtures against the
original committed algorithm produced identical serialized results.

Lint passed with the same 25 image warnings; the database-disabled production
build passed with baseline missing-provider-environment and Node warnings. Docs
check passed all 49 notes; schema metadata (38 tables), Drizzle, production audit
(zero findings), formatting and diff checks passed. No production database was
used for validation. Released at `e3919a4dc8d80483ec002ccb0471ef73064b5372`:
Vercel `dpl_PdbmWB33c5kZHLm2jd6hvNLXZC4d` READY with matching production alias;
GitHub CI `34063449939` passed. Landing stats, next-round and rounds-list responses
matched pre-release hashes. Protected redirects and private session-read headers
passed; scoped logs had no error/fatal or 5xx entries or sampled sensitive patterns.
The next planned domain is Manager Profile and squad reads, retaining Lineup's
existing HTTP contract and separating fantasy manager identity from accounts.

## Architecture-check reconciliation

`chore/architecture-reconciliation` starts from the independent workflow merge
`1cf5cfd8`. Baseline typecheck and 24 focused tests passed, while the newly merged
architecture checker reported three findings. The obsolete Matches-to-database
exception is removed. One exact, documented Players-to-legacy-manager-service
exception preserves the already approved temporary read adapter until Managers
owns its contracts; it does not permit other legacy imports. Rounds now delegates
season resolution through a server-only query adapter because the shared helper
performs a database existence check. Season validation, call order, uncached
freshness, errors and HTTP behavior are unchanged. No shared season helper or
checker implementation is modified.

Regression tests reject sibling legacy imports, reject obsolete exceptions and
enforce season persistence through queries. Query tests preserve no-argument
default-season resolution, repeated reads and error identity. Architecture check
passes (693 modules, seven protected entrypoints), and all 50 focused tests pass.
`npm run verify` passed on pinned Node 24.20.0: skills, architecture, docs (52 notes),
typecheck, all 784 tests (one existing skip), lint (25 existing image warnings),
database-disabled production build, schema metadata (38 tables), Drizzle and diff
check. The build retained expected missing-provider-environment warnings. Production
dependency audit reported zero findings. No presentation moved; local browser
screenshots were not rerun. Released at `832b4c754c7f89063c5c088289ceaa239155a91b`:
Vercel `dpl_8eHSSXgis87pPfueYmGDu6jbkfhP` READY on the matching production alias;
CI `34065393437` passed, including browser contracts and visual regression. Public
reads, login redirects and private session-read headers passed production smoke
checks; scoped logs showed no error/fatal or 5xx entries or sensitive-value patterns.
No UI or Managers work was part of that maintenance slice.

## Parallel read-foundations batch

The user approved parallel implementation with controlled batched integration.
Base: `832b4c75`. Three isolated worktrees own Managers reads, base Standings reads,
and Search reads; `refactor/read-foundations-batch` owns cross-feature review,
architecture policy registration, this ledger and the combined release gate.
Feature agents commit locally and do not push, merge or deploy independently.
Detailed scope notes: [Managers reads](managers-read-migration.md) and
[Standings foundation](standings-read-foundation.md).
Focused tests run during development; full verification and deployment run on the
combined candidate after sequential integration. Heavy builds are coordinated to
avoid local resource contention, not skipped or weakened.

Scope is deliberately bounded: Managers squad/statistics/recent rounds before
profile composition; base Standings before performance/draft analytics; Search
read contracts without changing shell or Hoopgrid interactions. Managers consumes
Standings and Players through deliberate contracts. Existing manager-shaped
`/api/player/*` URLs remain HTTP compatibility adapters and will point directly
to Managers, avoiding a Players/Managers dependency cycle. No aliases are needed.

No application redesign, security-sensitive mutations, credential behavior,
dependencies, database schemas or production configuration are included. Preserve
all existing cache, input quirks, field types, envelopes and error behavior.
The batch is in progress, not yet validated or released. Manager Profile screens,
Standings analytics and the remainder of the migration are not claimed complete.

The three branches rebased conflict-free and fast-forwarded into the integration
candidate: Standings `d83df01` → `eb12e4dc`, Managers `6fdfa8a` → `8aedb1c3`,
Search `02fe90f` / `5971328` → `4f81d4e1` / `251175d8`.
Preparation commit `8a027c53` changes only two database singleton imports and adds
regression tests, avoiding cycles through legacy domain barrels. Query logic is unchanged.

The candidate now registers 15 framework entrypoints (previously seven). The
obsolete Players-to-manager-service exception is removed. Registering the three
session-fallback manager APIs exposes existing authentication persistence paths:
18 exact route/source/target exceptions cover only `auth.js` and the credential
repository's Drizzle/index/schema imports. Every exception has a reason and an
Accounts/credential security-gate removal condition. No authentication code or
checker implementation changes. Negative tests ensure another helper, route or
obsolete edge cannot use these allowances. This is documented infrastructure debt,
not permission for manager queries outside their feature boundary.

Managers has independent allowlisted models and owns the three retained
`/api/player/{rounds,stats,squad}` handlers. Legacy server adapters retain Profile,
Dashboard, Assistant and Lineup consumers. Players exposes recent scores through
its server contract over the single existing player-form query; that legacy query
remains until its analytics consumers migrate. Standings owns full/simple rankings,
league overview and value ranking; its three API handlers and base page call
services directly. Existing Standings query/service names remain adapters for
unmigrated analytics/composition. Search owns validation, three sequential queries,
mapping and service; its API and old query/service exports reuse one implementation.
SearchDropdown, CommandPalette and HoopgridSearch keep their existing API calls.

All legacy ID/sort/search quirks, numeric strings/nulls, ordering, response fields,
cache TTLs and private/no-store manager responses remain intentional compatibility
contracts. No new routes or aliases, persistent cache, screen moves or UI changes.
Combined focused validation passed 245 tests, including the 140-case session cache
matrix; architecture check passed 718 modules and all 15 protected entrypoints.
Independent cross-review found no Standings/Search compatibility blocker. Complete
verification and release results follow when available; the candidate is not yet released.

Combined verification initially caught two missing documentation navigation links
and a transitive Teams-to-Managers cycle through the legacy Team query's database
barrel. The notes are linked above; that helper now imports the same `pgClient`
from `connection.ts`, with a third connection-import regression case. No SQL or
checker assertion was changed to hide the cycle. Independent cross-review confirmed
the correction and found no Managers compatibility blocker.

Final `npm run verify` passed on pinned Node 24.20.0: skills, architecture (718
modules, 15 entrypoints), docs (54 notes), typecheck, full suite (902 passed, one
existing skip), lint (25 existing image warnings), database-disabled production
build, schema metadata (38 tables, no drift), Drizzle and diff check. Focused graph
and Teams regression rerun passed 63 tests. Build warnings were limited to baseline
missing provider configuration; no production environment was loaded. Production
dependency audit reported zero findings. Presentation is unchanged; CI browser
verification and safe production HTTP/log checks remain release gates.

Release note: `d12456ea` was pushed after the full verification passed, but an
additional committed-range whitespace check detected inherited trailing spaces
inside extracted SQL templates. The coordinator's command sequence incorrectly
continued after that nonzero check. A scoped follow-up removes only trailing SQL
whitespace in four new query files; `git diff --ignore-space-at-eol --exit-code`
confirms no other query change. The committed-range check is now explicitly part
of the final release review. SQL templates were byte-identical at extraction;
the follow-up changes whitespace only. Deployment/CI and smoke verification must
target the final follow-up SHA, not the first push.

## Read-foundations release receipt

Main and origin/main are `881e4818c24efafac69e0732e992464ff09ecd68` after clean
fast-forward integration and ordinary pushes. Vercel deployment
`dpl_GAv8GErYtAMe5wGzLVryL761US2z` is READY at the matching SHA and production alias.
The whitespace-only follow-up passed 245 focused tests, formatting, scoped lint and
the committed-range whitespace check. It changes no SQL tokens or bound parameters.

All nine sampled canonical response hashes matched their pre-release baselines:
three manager endpoints, full/sorted standings, overview, value ranking, and two
Search cases. Additional populated-manager reads returned statistics, 21 squad
players and 45 rounds with exact private/no-store headers. Login and session
endpoints responded normally; protected routes retained login redirects. Anonymous,
invalid and null/undefined-fallback manager requests retained private 400 responses.
A valid Team read returned 200; not-found Team/Player/official-Match reads retained
private 404 responses. Deployment-scoped error/fatal and 5xx log queries returned
no entries; sampled logs and responses contained no sensitive-value patterns.
These are bounded observations, not proof about all future requests or logs.

GitHub CI `34068722840` passed on the final SHA: Test & Build, Format Check,
and Browser contracts and visual regression all succeeded. This post-deployment
receipt is retained as a documentation-only follow-up on the batch branch for the
next integration; no extra production deployment is needed solely to record its ID.

No authenticated production visual review was performed. No presentation moved,
and no schema, dependency, environment, credential, fallback or provider-operation
configuration changed. The primary and all three task worktrees are clean.

Next parallel batch: Tournament core/manager participation, Manager top contributors,
and Standings all-play-all reads. These provide the remaining data contracts for
a subsequent Manager Profile desktop/mobile composition migration. Preserve existing
tournament JSON/ID matching and statistical formulas; no next slice has started yet.

## Manager Profile dependency batch

`refactor/profile-dependencies-batch` starts from fetched production `881e4818`.
Primary main was clean; three new sibling worktrees isolate Tournament read core,
Manager contributors and Standings head-to-head. The prior documentation receipt
is included unchanged. No prior mobile worktree or unrelated changes are modified.
Baseline typecheck, architecture (718 modules, 15 protected entrypoints) and 127
focused tests passed on pinned Node 24.20.0. Production dependency audit is clean.

Managers now owns the historical contributor projection through
`getManagerContributorsData`. Its one query retains season binding, captain doubling,
bench/base-point and games-count rules, unlimited descending ordering, nulls and
parseInt-or-zero conversions. The old query name and user service remain adapters
for desktop/mobile Profile and Assistant. No dedicated HTTP endpoint is added.

Standings owns `fetchAllPlayAllStats`, its sequential queries and virtual league
calculation. The same shared in-memory key `advanced:all-play-all:<season>` and
900-second TTL remain. Raw computed percentages (including NaN) are cached and
sorted before allowlisting; the feature returns null for non-finite percentages,
while the legacy server adapter restores NaN. JSON responses are unchanged. Season
resolution errors still propagate; caught query failures still log and cache an
empty array. Bidirectional legacy/feature cache-hit tests prevent duplicate reads.
Only the all-play-all import changes in the advanced HTTP dispatcher; the other
12 branches and their headers/statuses remain tested legacy behavior. The mixed
handler is not falsely registered as fully migrated; no checker exception is added.

Tournaments extraction covers the five core reads and manager participation, not
global analytics or screen composition. Explicit row allowlists include the formerly
undeclared `season_id` and fixture phase fields. Number/string-zero ID quirks, SQL
substring participation matching, UNION ALL ordering, strict playoff participant
comparison, invalid JSON errors and caught partial-statistics behavior are preserved.
Historical JSON documents remain a deliberate compatibility projection, including
malformed/prototype-key phase behavior; they are not claimed as a fully normalized
presentation model. A type-only legacy detail adapter retains the old non-null-name
typing for one existing mobile caller, while the feature model correctly allows null.
The adapter does not coerce runtime data or change UI props.

Independent source reviews found no contributor, head-to-head or Tournament
compatibility blocker. SQL comparisons preserve all tokens; extracted templates
are checked for trailing whitespace across the entire committed change range.
No screens, URLs, auth, credentials, fallback, schema, dependencies or production
configuration change. Complete combined verification and deployment are pending.

Combined implementation validation passed on Node 24.20.0: `npm run verify`
completed skills, architecture (738 modules, 15 protected entrypoints), docs (55
notes), typecheck, full suite (988 passed, one existing skip), lint (25 existing
image warnings), database-disabled production build, schema metadata (38 tables,
no drift), Drizzle check and diff check. Build warnings only reported the expected
absent provider configuration. The explicit full-range `git diff --check 881e4818`
also passed. No application environment files were loaded or database migrations
applied. Production dependency audit reported zero vulnerabilities.

Original-to-rebased commits: contributors `7503e4a` → `07037d56`; head-to-head
`9301573a` → `d35451ed`; Tournaments `0c2d154` / `79292c4` → `b75fc8a2` /
`40e77f66`. All rebases and sequential fast-forwards were conflict-free. Before
release, production all-play-all returned seven rows; canonical response hashes
were captured without storing payloads for post-release comparison. Production
deployment and CI/browser verification remain pending at this validation checkpoint.

## Manager Profile dependencies release receipt

Released by clean fast-forward and ordinary main push at
`084bd9fead90202544e8d592132b95c273ad0c2a`. Vercel deployment
`dpl_2TkzmnuMpCsy3aaE7ttg1JPVqdmT` is READY at the same SHA and production alias
(`advanced-euroleague-biwenger-stats-f0pv96jc9.vercel.app`). Main and all three
implementation worktrees are clean; all feature commits are integrated.

GitHub Actions run `34098109510` completed successfully: Test & Build, Format
Check, and Browser contracts and visual regression all passed.

Safe production probes preserved canonical hashes for all-play-all (seven rows),
invalid advanced type, full standings and the manager statistics sample. Login
and session endpoints returned 200. Manager Profile/contributors/tournaments,
Tournament list/detail/fixtures and reference feature pages retained login
redirects. Anonymous manager squad/round requests retained private/no-store 400
responses. Deployment-scoped error/fatal and 5xx queries returned no entries;
sampled responses and logs contained no sensitive-value patterns. No production
mutations or authenticated production visual review were performed.

The code batch is complete, but the overall migration is not. Next: Manager Profile
page/service orchestration and desktop/mobile component ownership, with existing
presentation preserved. The [overview](migration-overview.md) distinguishes the
remaining regular domain work, temporary adapters and separate security gates.
This documentation-only receipt will accompany the next batch rather than trigger
an additional deployment solely to record the deployment ID.
