---
title: C01 Manager read ownership
description: Source contracts, implementation checkpoints and remaining acceptance for Manager directory and analytics.
audience:
  - maintainer
  - agent
status: active
---

# C01 Manager read ownership

## Assignment and current state

Single owner: current campaign agent. Base `2d218368`, descending from main `354f66e1`.
Branch/worktree: `refactor/architecture-completion` in
`../biwengerstats-next-architecture-completion`.
User authorized the complete campaign; this is not a parallel worker dispatch.
**IN PROGRESS. Directory checkpoint implemented; C01 is not complete or VERIFIED.**

Source scope: Managers models/query/service/mapper/tests and entrypoints; existing directory HTTP
adapter; legacy user-service/query adapters; owning Players form contract if needed for captain
recommendations. Shared changes are limited to public/server exports, exact architecture policy
entries and corresponding contract tests. No other worker owns these files.

Forbidden: auth, credentials, provider mutations, schema/dependencies, redesign and deployment.
Credential-related getUserWithPassword remains untouched in its existing location until C11a.
Do not infer authority to alter validation, caches or personal data exposure.

## Callers and ownership decisions

| Source                                                                                       | Current consumers                                                              | Target / remaining package                                                   |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| fetchAllUsers                                                                                | /api/users; Schedule page via legacy barrel                                    | Managers directory service; Schedule alias retained until C07                |
| fetchUserSeasonStats, fetchUserSquadDetails, fetchUserRecentRounds, fetchUserTopContributors | Assistant context; Lineup phone squad; legacy callers                          | Existing Managers Profile contracts; adapter retirement coordinated with C11 |
| getUserCaptainStats                                                                          | Dashboard captain endpoint and aggregates                                      | Remaining C01 manager analytics contract                                     |
| getUserHomeAwayStats                                                                         | Dashboard home-away endpoint and aggregates                                    | Remaining C01 manager analytics contract                                     |
| getCaptainRecommendations                                                                    | Dashboard captain suggestion and aggregates                                    | C01 orchestration using a deliberate Players form contract                   |
| getPersonalizedAlerts                                                                        | Home and Dashboard orchestration                                               | C01 manager alert projection; preserve ordering/text/limits                  |
| getSquadStats, getUserSquad                                                                  | No direct runtime callers found by symbol search; global barrel exports remain | Verify aliases/scripts/tests before removal or ownership decision            |
| getUserWithPassword                                                                          | /api/user/change-password                                                      | C11a, unchanged                                                              |
| statsService global tournament calculations                                                  | Tournament pages/components                                                    | C02, not C01                                                                 |

The Player form query still lives in the legacy core layer and Players has a query adapter.
Its existing public recent-scores contract omits the average/form-score fields used by captain
recommendations. Add a deliberate complete form projection before migrating that consumer; do not
deep-import Players internals or duplicate its SQL/formula.

## Directory contract and implementation

- /api/users GET has no session identity, URL input, validation or user-specific selection.
- Existing force-dynamic retained; success is 200 with success/data envelope and
  public max-age=900, stale-while-revalidate=60. Errors retain generic 500 and exact private/no-store headers.
- Query resolves the read season on every call; selects active season managers; orders by name then ID.
  Text IDs including leading zeros, nullable name/icon and color_index remain unchanged.
- One shared infrastructure query remains below Managers and Rounds to avoid the known feature cycle.
  Feature query adapter exposes its row type to the mapper; no mapper imports persistence infrastructure.
- Mapper explicitly selects four fantasy-directory fields; no raw record or credential fields escape.
- No cache wrapper, query duplication, SQL change, component change or internal REST request added.
- Legacy fetchAllUsers becomes a compatibility alias to the same feature service. Existing HTTP route
  tests mock its new public server entrypoint; unrelated Lineup/credential tests retain their assertions.
- /api/users is newly registered in the architecture policy without exceptions.

## Validation and next steps

Baseline full verify passed before application edits (1,277 tests, build, schema and existing warnings).
The baseline browser build was compiled before directory edits; no build/fixture/browser-test file was
changed or rebuilt while it runs. Its result is not candidate browser verification.

Directory focused run: 108 tests in 16 files PASS. New tests cover field allowlisting, text IDs/nulls,
ordering, no server memoization, empty/populated HTTP envelopes, exact cache headers and error propagation.
Initial missing server-only test stub was corrected. The graph initially rejected the mapper's direct
database type import; it now imports through the feature query contract. No checker was relaxed.
Architecture check PASS: 798 modules, 45 protected entrypoints. Typecheck PASS.
Full candidate acceptance remains pending before verification is claimed.

## Performance and preparation checkpoint

Captain, home-away, captain recommendations and personalized alerts now use Managers-owned queries,
explicit mappers and services. Legacy exports alias those services for unchanged Dashboard/Home callers.
SQL fingerprint tests preserve all nine statements, parameter order and season selection. Tests preserve
aggregate null/missing behavior, ranking ties, labels, limits, error propagation and absence of memoization.
The additive Players form service exposes an allowlisted form projection; its existing score-only
contract remains unchanged. The legacy form query remains one shared implementation pending C14 closure.

Unused getSquadStats/getUserSquad implementations were removed after source/script/test consumer checks;
Compare's independently used private function remains untouched. getUserWithPassword is unchanged.
The remaining analytics/records helper is consumed by dashboardService and combines highest round,
highest transfer and largest price gain: C09 owns composition, with Rounds/Market projections to be
resolved in C05/C09. It is not an unassigned Managers query.

Focused validation: 266 tests across 19 files PASS; architecture 806 modules/45 protected entrypoints
PASS; typecheck PASS. Full npm run verify PASS: 1,305 tests, one existing skip; lint retains 25 existing
image warnings; production build, 38-table metadata audit, Drizzle and diff checks PASS. No schema,
dependency, authentication, HTTP handler policy or UI changes were made in this checkpoint.

Original baseline browser suite completed: 90 PASS (10.1 minutes). The separate candidate browser run
for the c9d6a816 application checkpoint completed: 90 PASS (9.1 minutes), all nine viewports. Existing
mobile-shell stream-close teardown messages appeared without a failed test. The disposable server and
database stopped normally. This run does not validate subsequent Tournament source edits.
C01 remains IN PROGRESS until adapter bookkeeping is reconciled. No push or deployment is authorized.

Next: reconcile C01 retained-adapter bookkeeping while completing C02 Tournament consumers.
Stop for an unexpected contract/security decision or new graph cycle. Preserve temporary adapters
until the named downstream owners have migrated; document each one through campaign closure.
