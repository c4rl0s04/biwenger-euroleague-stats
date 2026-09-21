---
title: Migration overview
description: Current feature coverage, remaining work, and the next architectural milestones.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Migration overview

This is a scope summary, not an independent task queue. The [master tracker](../migration/tracker.md)
is authoritative for remaining tasks, dependencies and next actions. Reconciled at main `1933e033`
on 2026-09-20. A migrated read experience does not mean every mutation or external consumer is
finished. Release evidence and historical decisions remain in the [migration ledger](migration-status.md).

## Status vocabulary

- **Implemented:** code and tests committed on a feature branch.
- **Verified:** the recorded local acceptance checks passed.
- **Integrated:** the commits are ancestors of main.
- **Deployed:** production serves the verified main commit.

The current Rounds/Standings integration is tracked in the
[release receipt](../migration/reports/rounds-standings-release.md).
Implementation completion is not a claim that every broader domain or legacy consumer is migrated.

## Established reference flows

Matches, Team Profile, Players catalogue/profile and Manager Profile have feature-owned read services,
models and desktop/mobile composition. Their public/server contracts, HTTP compatibility,
server guards and transitive import graphs are tested. Some explicitly retained shared
query adapters remain; these references are not a claim that all global code is gone.

## Read foundations and their remaining work

Tournament read migration: Tournament catalogue/detail/sections, analytics and screens are now
fully migrated into `src/features/tournaments` and integrated on main via PR #35. See the
[C02 receipt](../migration/reports/c02-tournament-reads.md) for exact evidence, contracts and testing details.

| Domain      | Established boundary                                                                              | Still to migrate                                                            |
| ----------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Rounds      | Calendar plus historical results, analysis, APIs and desktop/phone screens (completed read slice) | Separate Home/Dashboard last-round projections and legacy consumer adapters |
| Managers    | Complete Profile, Directory, Captain Stats, Home/Away, Captain Recommendations and Alerts         | Lineup squad mutations, private operations (reserved for security gate)     |
| Standings   | Complete rankings, progression, performance/draft analytics, APIs and screens                     | External leader-gap/league-average consumers and adapter retirement         |
| Search      | Validated directory search, typed results and HTTP service                                        | Shell/search interaction ownership during the shared UI pass                |
| Tournaments | Complete read experience (catalogue, detail, sections, bracket and analytics)                     | External Profile consumer compatibility maintained                          |
| Predictions | Complete read experience (overview, evolution, ranking, teams, history)                           | Prediction ingestion and sync actions reserved for separate scope           |

## Previous deployed milestone: Manager Profile

`refactor/manager-profile-completion` completes feature ownership for `/user/[id]`:
desktop Profile, phone overview, and the five phone sections (`season`, `squad`,
`evolution`, `contributors`, `competitions`). Pages call Managers services directly;
its models, mappers, orchestration, cards and screens live inside the feature.
Tournaments and Standings retain ownership of their underlying domain information.
Existing URLs, access, caching, ordering, empty/error behavior and visuals are preserved.

Local validation passed: 1,044 unit/contract tests plus one existing skip, the full
verification workflow, 63 browser cases across nine viewports, and all 14 original
desktop/iPhone Profile screenshots. Profile Linux screenshot baselines and an
authenticated real-production-data visual review remain manual follow-ups, not
unfinished Profile implementation. Release evidence is recorded in the ledger.

At that historical milestone, directory and other analytics were pending. They subsequently
merged in PR #39. Private commands and downstream adapter retirement remain separate scopes;
this does not mean the accepted Profile read implementation must be repeated.
Legacy user/Tournament adapters stay for other consumers, while Profile no longer
imports the global service barrel. Reports distinguish **complete user-facing
scopes**, **partial domain foundations**, and **not-yet-migrated areas**. A data-service
extraction alone is not a completed feature.

## Completed implementation: Rounds and Standings read experiences

`refactor/rounds-read-completion` moves `/rounds`, its four phone sections and all
eight `/api/rounds/*` handlers into Rounds ownership. Query extraction, typed mapping,
bounded list/results/history/formation services and desktop/phone composition belong
to the same batch. This is the historical fantasy read experience, not private Lineup
operations. The calendar foundation is unchanged. Local verification and release
status are tracked in the ledger; this entry does not claim a production deployment.

Legacy query/service adapters remain for other consumers. The old HeadToHeadCard is
owned by the pending Compare experience, not an unfinished Rounds screen. Separate
Home/Dashboard last-round projections and Predictions helpers remain outside this batch.

Standings now owns its desktop and phone overview, eight phone sections, all 19 HTTP
handlers and 13 advanced dispatcher variants. Its bounded services/queries/mappers preserve
formulas, ID/null distinctions, route-specific caching and external compatibility adapters.
The [Standings implementation report](../migration/reports/001-standings.md) records corrections;
the release receipt distinguishes local checks from integration and deployment.

## Current merged scopes and remaining work

News (Task 08) is verified locally, with full verification and 27 browser cases passing; see the
[News receipt](../migration/reports/task-08-news.md). It owns the shared ticker and Dashboard strip,
not a new page. This does not mark Home complete or claim a release.

Tournaments, Predictions, Playoffs, public Market and Managers remaining reads are merged via
PRs #35–39 respectively. Their receipts retain original test evidence; this update does not
certify their production deployments.

Schedule (Task 04) is integrated and deployed at `6aa275b6`;
see its [acceptance receipt](../migration/reports/task-04-schedule.md). The config-test isolation
follow-up resolves the prior verifier failure without changing application or verifier behavior.
Compare (Task 05) is integrated and pushed at `8bc0af22`; Vercel was not inspected under the user's
GitHub-only release instruction. Its [receipt](../migration/reports/task-05-compare.md) records the full/lite services,
screens, retained Assistant adapter and 9/9 original-screen browser acceptance.
Dashboard data (06) is verified and integrated into local main at `700b727b`; its
[receipt](../migration/reports/task-06-dashboard-data.md) records 18/18 browser checks and separates
data ownership from the pending screen slice (07). GitHub publication and Vercel verification are distinct.
Dashboard screens (07) are verified and integrated locally at `c4c55057` after rebasing onto
`f47e2a65`, with 2,437 tests and 18 browser cases passing, including original screenshots.
See the [Task 07 receipt](../migration/reports/task-07-dashboard-screens.md) for publication context.
Remaining read features: News/Home (08–09)
and Season Review (10–11). Sensitive operations are Tasks 12–21; infrastructure/shared UI and final
closure are Tasks 22–27. The tracker owns their states and acceptance criteria.

Residual Team detail orchestration/shared Player form work from the preserved campaign belongs
to Task 25 review against the current schema. Saved Market components already match main; do not
restart its old checkpoint Q. External Rounds/Standings/Market adapters retire as their final
consumers migrate. Search interaction ownership belongs to Task 23. Unique UI token work is Task 24.
The known Market phone-bids defect needs a separate behavior decision before final acceptance.
Existing URLs remain compatibility contracts; renaming them is not a completion requirement.

Existing code references: [legacy queries](../../src/lib/db/queries),
[legacy services](../../src/lib/services), [application pages](../../src/app), and
[domain features](../../src/features). Some old modules are thin compatibility exports;
others still own substantial logic. File counts alone would overstate remaining duplication.

## Adjacent database and security foundation

The feature migration is progressing alongside a separate platform-hardening track. These changes
support the target architecture but are not counted as feature-domain completion:

- Season-varying player, team, and manager attributes now live in `player_seasons`, `team_seasons`,
  and `user_seasons` rather than falling back to deprecated columns on global identity tables.
- `user_seasons` uses `(season_id, user_id)` as its identity, and season-dependent references use
  composite foreign keys where the relationship requires season isolation.
- Official game and player-game staging tables were retired; official game state is consolidated
  into `matches` and materialized player performance into `player_round_stats`.
- Personal Biwenger credentials now use `user_biwenger_credentials` as the sole canonical store;
  the legacy plaintext column and fallback were removed.
- Application tables are protected from public Supabase Data API roles through RLS plus explicit
  privilege and default-privilege revocation, while normal application access remains server-side.

See the [data and sync architecture](data-and-sync.md),
[data model reference](../reference/data-model.md), and
[authentication and security](authentication-and-security.md) for the current contracts.

## Separate security gates

- Hoopgrid: challenge creation in GET and mixed read/write/private-response behavior.
- Lineup and Market private operations: provider mutation and authorization review.
- Accounts and Settings: authentication, linking and encrypted credential-boundary review.
- Assistant: privacy/provider review before structural migration of its orchestration.

Authentication/session behavior, credential encryption and rotation, database authorization,
production secrets, and provider mutations remain outside ordinary read-migration batches. The
plaintext personal-credential fallback no longer exists; changes to the current encrypted credential
boundary require their own explicit security scope. Static PWA pages and framework/authentication
protocol adapters do not need artificial features.

## Completion standard

Completion requires coherent ownership across services, queries, models, screens and actual
HTTP consumers; tested compatibility and cache/access policy; green checks; and verified
deployment. Visual redesign remains a separate project. Current architectural work is intended
to preserve appearance and interactions, not create a new premium visual design yet.
