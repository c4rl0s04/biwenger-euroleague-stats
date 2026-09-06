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
- These are historical starting-point SHAs; the completed cache release is recorded below.

## Domain ledger

| Domains                                                  | Status / next boundary                                                                         |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Matches, Teams                                           | Integrated; official DTOs, persistence guards and graph enforcement need refinement            |
| Players                                                  | Integrated and deployed; manager adapter remains temporary; transitive boundary review pending |
| Rounds                                                   | Calendar foundation, then historical results and analysis                                      |
| Managers                                                 | Profile, directory and squads remain legacy                                                    |
| Standings                                                | Base rankings, performance analytics and draft analytics are separate slices                   |
| Tournaments                                              | Legacy read services and components                                                            |
| Predictions, Playoffs                                    | Legacy scoring/read services; preserve distinct formulas                                       |
| Schedule                                                 | Map uses Matches; squad overlay remains legacy                                                 |
| Market public reads                                      | Legacy analytics; separate from private operations                                             |
| Dashboard, Compare                                       | Legacy composition; migrate after owning read contracts                                        |
| Home, News, Search                                       | Existing partial layers; migrate contracts and screens                                         |
| Season Review                                            | Existing pure engine and artifact readers; feature boundary pending                            |
| Hoopgrid                                                 | Security gate: challenge creation in GET and mixed private response                            |
| Lineup, Market operations                                | Deferred pending provider-operation security gate                                              |
| Accounts, Settings                                       | Deferred pending credential observation gate                                                   |
| Assistant                                                | Deferred pending privacy/provider review                                                       |
| Shell, shared UI                                         | Structural ownership pass after domains; no redesign                                           |
| Login protocol, PWA utility routes, framework boundaries | Infrastructure; no artificial feature required                                                 |

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
check passed. Release verification is pending for this slice.
The full migration objective remains incomplete. Protected pages, credentials,
fallback configuration, database schema and provider operations are unchanged.
