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

## Established reference flows

Matches, Team Profile and Players catalogue/profile have feature-owned read services,
models and desktop/mobile composition. Their public/server contracts, HTTP compatibility,
server guards and transitive import graphs are tested. Some explicitly retained shared
query adapters remain; these references are not a claim that all global code is gone.

## Read foundations and their remaining work

| Domain      | Established boundary                                           | Still to migrate                                                    |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| Rounds      | Calendar and current/next/last-round policy                    | History, results, analysis and screens                              |
| Managers    | Season statistics, squad, recent rounds and contributors       | Profile orchestration/screens, directory and remaining analytics    |
| Standings   | Base rankings, league overview, value and virtual head-to-head | Performance/draft analytics, other advanced projections and screens |
| Search      | Validated directory search, typed results and HTTP service     | Shell/search interaction ownership during the shared UI pass        |
| Tournaments | List/detail, standings, fixtures and manager participation     | Tournament analytics, page composition and components               |

## Current batch: Manager Profile dependencies

`refactor/profile-dependencies-batch` starts from production `881e4818`, includes the
previous release receipt, and combines three isolated implementation branches:

- `refactor/tournament-read-core`: tournament list/details, standings, fixtures and
  manager participation; existing tournament and Manager Profile consumers retain adapters.
- `refactor/manager-contributors`: the lineup-derived top-contributor projection,
  with captain/bench rules unchanged; Profile and Assistant keep their existing contract.
- `refactor/standings-head-to-head`: virtual all-play-all records, including the existing
  `/api/standings/advanced?type=all-play-all` dispatch branch and 15-minute season cache.

The combined implementation is released at `084bd9fe`; validation and deployment
evidence is recorded in the ledger. It does not move Manager Profile or Tournament screens,
rename APIs, change statistical formulas, or migrate every branch of the advanced
Standings endpoint. Its purpose is to make the remaining Profile reads available
through deliberate domain contracts, enabling a focused composition pass next.

## Remaining regular migration work

1. Complete Manager Profile orchestration and desktop/mobile screen ownership using
   Managers and Tournaments contracts; migrate the manager directory separately.
2. Finish Rounds history/analysis, Standings performance and initial-squad/draft analytics,
   and Tournament analytics/screens as bounded slices with formula characterization.
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
