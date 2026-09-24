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
is authoritative for remaining tasks, dependencies and next actions. Reconciled at main `8dbdce9c`
on 2026-09-24. A migrated read experience does not mean every mutation or external consumer is
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

| Domain        | Established boundary                                                                              | Still to migrate                                                            |
| ------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Rounds        | Calendar plus historical results, analysis, APIs and desktop/phone screens (completed read slice) | Separate Home/Dashboard last-round projections and legacy consumer adapters |
| Managers      | Complete Profile, Directory, Captain Stats, Home/Away, Captain Recommendations and Alerts         | Lineup squad mutations, private operations (reserved for security gate)     |
| Standings     | Complete rankings, progression, performance/draft analytics, APIs and screens                     | External leader-gap/league-average consumers and adapter retirement         |
| Search        | Validated directory search, typed results and HTTP service                                        | Shell/search interaction ownership during the shared UI pass                |
| Tournaments   | Complete read experience (catalogue, detail, sections, bracket and analytics)                     | External Profile consumer compatibility maintained                          |
| Predictions   | Complete read experience (overview, evolution, ranking, teams, history)                           | Prediction ingestion and sync actions reserved for separate scope           |
| Schedule      | Complete schedule read experience and squad overlay (Task 04)                                     | Lineup submission commands (Task 15) and Assistant adapter (Task 20)        |
| Compare       | Complete comparisons, full/lite APIs, and screens (Task 05)                                       | Assistant adapter (Task 20) and final closure (Task 25)                     |
| Dashboard     | Full analytics data reads and desktop/phone presentation screens (Tasks 06–07)                    | News/Home/Assistant legacy adapter retirement (Tasks 08/09/20)              |
| News          | Shared ticker, Dashboard strip, and feed reads (Task 08)                                          | Feed ingestion and sync lifecycle (Task 22)                                 |
| Home          | Personal summary, unified activity feed, and landing reads (Task 09)                              | Shell and layout interaction pass (Task 23)                                 |
| Season Review | Pure calculation engines, artifact reader, and presentation screens (Tasks 10–11)                 | Report generation commands (Task 21)                                        |

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

All read experiences across the application are now fully migrated into feature architecture:

- **Schedule (Task 04)** is integrated and deployed at `6aa275b6`; see the [Schedule receipt](../migration/reports/task-04-schedule.md).
- **Compare (Task 05)** is integrated and pushed at `8bc0af22`; see the [Compare receipt](../migration/reports/task-05-compare.md).
- **Dashboard data & screens (Tasks 06–07)** are integrated locally and pushed at `700b727b` and `c4c55057`; see the [Dashboard data receipt](../migration/reports/task-06-dashboard-data.md) and [Dashboard screen receipt](../migration/reports/task-07-dashboard-screens.md).
- **News (Task 08)** is integrated at `69dfa07f`; see the [News receipt](../migration/reports/task-08-news.md).
- **Home (Task 09)** is integrated at `fd424956`; see the [Home receipt](../migration/reports/task-09-home.md). It owns `/`, the phone activity/summary, desktop landing, and both existing APIs with full verification (2,505 tests) and 190 browser cases.
- **Season Review data (Task 10)** is integrated at `c28481b2`; see the [Season Review data receipt](../migration/reports/task-10-season-review-data.md).
- **Season Review screens (Task 11)** is integrated at `0b001b17`; see the [Season Review screens receipt](../migration/reports/task-11-season-review-screens.md).
- **Sensitive-operation inventory (Task 12)** is integrated at `b678cd14`; see the [Task 12 inventory receipt](../migration/reports/task-12-sensitive-operation-inventory.md). It inventories 16 database writes, provider mutations, credential boundaries, and AI provider operations, serving as the required security gate for Tasks 13–21.

Tournaments, Predictions, Playoffs, public Market and Managers remaining reads were earlier merged via PRs #35–39.

The next domain milestone is **Task 13 — Provider boundaries**, which initiates the provider and mutation migration track (Tasks 13–21). In parallel, the UI migration track has completed UI-00, UI-01A, UI-01T (`55765dfe`), and UI-01B (`665fd1d7`, PR #44, core primitives: Button, IconButton, Input, Badge, Avatar, Skeleton); the next UI milestone is **UI-01C — Interactive Controls & Overlays**.

Residual Team detail orchestration/shared Player form work from the preserved campaign belongs to Task 25 review against the current schema. Saved Market components already match main; do not restart its old checkpoint Q. External Rounds/Standings/Market adapters retire as their final consumers migrate. Search interaction ownership belongs to Task 23. Unique UI token work is Task 24. The known Market phone-bids defect needs a separate behavior decision before final acceptance. Existing URLs remain compatibility contracts; renaming them is not a completion requirement.

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
