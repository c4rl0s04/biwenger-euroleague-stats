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

This is a scope summary, not a percentage-complete estimate. A feature directory does
not mean its screens, queries, APIs and operations are all migrated. Release evidence
and historical decisions live in the [migration ledger](migration-status.md).

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

| Domain      | Established boundary                                                                              | Still to migrate                                                            |
| ----------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Rounds      | Calendar plus historical results, analysis, APIs and desktop/phone screens (completed read slice) | Separate Home/Dashboard last-round projections and legacy consumer adapters |
| Managers    | Complete Profile read flow, squad, season statistics, recent rounds and contributors              | Directory and other manager analytics                                       |
| Standings   | Complete rankings, progression, performance/draft analytics, APIs and screens                     | External leader-gap/league-average consumers and adapter retirement         |
| Search      | Validated directory search, typed results and HTTP service                                        | Shell/search interaction ownership during the shared UI pass                |
| Tournaments | List/detail, standings, fixtures and manager participation                                        | Tournament analytics, page composition and components                       |

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

The manager directory and unrelated manager analytics are separate pending scopes;
this milestone does not claim that every Managers-domain capability is migrated.
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

## Remaining regular migration work

1. Migrate the manager directory and remaining manager analytics separately from the
   completed Profile read experience.
2. Finish Tournament analytics/screens as the next bounded slice, reusing its migrated core.
3. Establish Predictions and Playoffs read ownership without merging their distinct scoring rules.
4. Migrate Schedule, public Market reads, Dashboard, Compare, Home and News compositions
   after their owning read services are ready.
5. Move Season Review's pure engine/artifact readers into an explicit feature boundary.
6. Finish application-shell/shared-UI ownership and remove obsolete global adapters only
   after checking all consumers. Evaluate canonical API names without deleting legacy URLs.

Existing code references: [legacy queries](../../src/lib/db/queries),
[legacy services](../../src/lib/services), [application pages](../../src/app), and
[domain features](../../src/features). Some old modules are thin compatibility exports;
others still own substantial logic. File counts alone would overstate remaining duplication.

## Separate security gates

- Hoopgrid: challenge creation in GET and mixed read/write/private-response behavior.
- Lineup and Market private operations: provider mutation and authorization review.
- Accounts and Settings: authentication, linking and credential observation gate.
- Assistant: privacy/provider review before structural migration of its orchestration.

Credential encryption and plaintext fallback, authentication/session behavior, database
schema/RLS, production secrets and provider mutations are unchanged by these read batches.
Static PWA pages and framework/authentication protocol adapters do not need artificial features.

## Completion standard

Completion requires coherent ownership across services, queries, models, screens and actual
HTTP consumers; tested compatibility and cache/access policy; green checks; and verified
deployment. Visual redesign remains a separate project. Current architectural work is intended
to preserve appearance and interactions, not create a new premium visual design yet.
