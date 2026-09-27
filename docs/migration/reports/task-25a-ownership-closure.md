---
title: Task 25A ownership closure
description: Non-UI ownership, adapter retirement, policy coverage and remaining closure gates.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 25A — Non-UI ownership closure

Base: main `1be12d61`; implementation `55893d73` on `refactor/ownership-closure`.
The [approved plan](../task-25-plan.md) separates this work from 25B. **25A is implemented and verified locally.** Task 25 is not complete and this receipt
does not authorize Tasks 26–27 to skip combined acceptance.

## Ownership and caller inventory

Run `node scripts/architecture/ownership-inventory.mjs > /tmp/ownership-inventory.json`
from this checkout. The deterministic report records every runtime module's exports,
resolved imports, actual callers, owner, disposition, contract, verification and blocker.
It includes `src`, `scripts`, root configuration, `public/sw.js`, package commands, full GitHub workflow definitions and
framework/operational entrypoint classification. Tests are excluded from runtime callers
and verified separately. No provider or database operations run during inventory.

The closure snapshot contains 1,109 runtime/configuration modules including scripts, 119 protected
application entrypoints and no computed module references. The two unresolved relative
exports in `src/components/index.js` (`./standings`, `./player`) are pre-existing UI barrel
debt assigned to 25B. Static analysis does not claim to resolve arbitrary runtime code
construction or shell expansion; workflow command bodies are included for manual review.
Workflow commands use package scripts or the inventoried scripts tree; none calls a
retired domain adapter. Database barrel consumers in operational scripts import only
connection exports, which remain available.

| Module or export group                                             | Actual consumers / owner                                                                          | Disposition and preserved contract                                                                                                      | Verification / gate                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Assistant context reads                                            | Assistant service; Standings, Managers, Market, Rounds, Dashboard, Compare and Schedule contracts | Direct owning feature imports; same actor IDs, selected contexts, formatting, limits and failure behavior                               | Assistant suites, explicit 100-round and canonical-calendar regression cases |
| Team competition helpers                                           | Team profile query and Teams services                                                             | Same-feature service import replaces global facade round trip                                                                           | Team profile/competition and architecture tests                              |
| `getPlayerFormMap`, `computePlayerFormScores`                      | Players query boundary and Team profile                                                           | Retained single shared typed competition projection; finished matches, season isolation, zero/DNP/unknown values and ordering unchanged | Shared Player form, ranking, captain and Team tests; no SQL change           |
| `readManagerDirectory`                                             | Managers, Rounds, Standings and Market                                                            | Retained minimal active-season projection; prevents Managers → Players → Teams → Matches → Rounds → Managers cycle                      | Manager-directory and season-isolation contracts                             |
| `src/lib/db/index.ts`                                              | Auth, repositories, sync and operational scripts                                                  | Connection-only exports `db`, `pool`, `pgClient`; domain exports retired                                                                | Full tests/build and script import inventory                                 |
| `src/lib/db/queries/core/users.ts#getUserWithPassword`             | Accounts repository                                                                               | Existing parameterized credential lookup retained verbatim; all unused domain reads removed                                             | Accounts/API contracts; separate auth/security gate                          |
| `src/lib/services/app/appShellService.ts`                          | App layout                                                                                        | Retained request-scoped standings/season adapter                                                                                        | Tasks 23–24 and 25B                                                          |
| Other global services and domain query facades                     | No remaining runtime consumers after Assistant/Lineup/Team changes                                | Removed; owning feature implementations remain the single source                                                                        | Moved golden/contract suites and full verify                                 |
| Shared UI components/hooks/constants, layouts, visual barrels      | UI migration                                                                                      | Inventory assigns ownership without visual changes                                                                                      | 25B; reconcile active application-shell worktree                             |
| Connection/schema/cache/sync/credential infrastructure and scripts | Existing operational owners                                                                       | Retained; Task 22 decisions unchanged                                                                                                   | Infrastructure suites; production operations excluded                        |

The test-covered `fantasy-scoring.ts` calculator remains a reference formula with no current
runtime callers; it is not presented as a production sync dependency. Unused shared visual
analytics/constants and mobile screen-state helpers are assigned to 25B, alongside the UI
barrels. Shared standings/ideal-lineup/match-score calculations have live feature or sync
callers and remain single implementations.

The active `refactor/application-shell` checkout was inspected read-only before removal.
Its remaining legacy data imports are the same Assistant, Lineup and Team imports changed
here; its app-shell adapter remains available. Combined integration still requires a new
inventory and verification. No changes were made to that worktree.

## Retired adapters and test preservation

Removed 42 obsolete runtime modules: the global services barrel, Dashboard/Standings/Schedule/User/Rounds adapters,
Assistant/Compare/Hoopgrid/Search/Season Review adapters, Market read wrappers, and unused
legacy Lineup/Market command wrappers and their response helpers. Removed domain query
facades under analytics/competition/features and `core/teams.ts`. The old user query
module now contains only the existing credential lookup. The eight global Season Review
re-export files, Hoopgrid criteria re-export, performance-calculation re-export, and
unconsumed global database types/SQL helper were also retired. Season Review and Hoopgrid
production consumers already use feature contracts; performance assertions moved to Rounds. Unused raw-query exports in
the Rounds/Standings contracts were also retired; Managers retains the identical
underlying simple-standings service through a direct feature export.

Market golden SQL/result, listing, transfer, opportunity and aggregate suites now test the
Market contract directly. Captain-form and Team competition suites moved to their feature
owners; Search season and HTTP tests target Search. Manager contributor/performance and
Standings tests retain their result/identity/season assertions at feature contracts.
API tests mock the actual feature boundary instead of a nonexistent global service barrel.
The Lineup allowlist canary moved to its canonical mapper; authenticated Market/Lineup
credential cases now exercise the canonical services through the real credential gateway
with a mocked provider client. No live provider requests occur.

The duplicate Assistant suite was compared before removal: its behavior assertions were
identical, differing only in module paths/mocks. Canonical tests retain those assertions
and add calendar field/identity and 100-round checks. Calendar tests now assert the owned
serializable camelCase model with the same round-selection, null and chronology behavior.
The removed Date/snake-case adapter envelope has no remaining consumer or HTTP contract.
Schedule's adapter-only Date/listItem projection is likewise unused; canonical Schedule
service tests retain not-found, empty-squad, argument and failure cases, and Assistant
checks its resulting text with an ISO date and presentation-only field present.

Legacy Market wrapper-only defaults (20 transfers/6 opportunities) have no runtime callers;
Assistant already supplies explicit limits. Provider success/error sanitization remains
covered by `features/provider/server/__tests__/client.test.ts`, including canary redaction,
soft failures and zero command retries; the unused permissive helper is removed.
Deletion assertions replace tests that merely checked a retired adapter forwarded to its owner.

## Architecture coverage and exceptions

Coverage grows from 99 to 119 entrypoints: five Market command routes, three Player read
routes, two Account command routes and the Lineup route, plus eight existing
Player catalogue/profile, Settings and Lineup pages. Registering these existing
boundaries does not migrate their presentation or change the UI workstream. The existing
Season Review server action is now protected too. The one Assistant `legacy-service`
exception is resolved. All original 138 persistence exceptions were re-evaluated by the
checker and remain live. Their intermediary owners are only `src/auth.js` and
`src/lib/credentials/repository.ts`.

Thirteen newly protected authenticated routes/pages/actions add 78 exact edges to those same intermediaries:
**216 persistence exceptions remain**, all explicitly gated on authentication/credential
ownership. This increase reflects broader enforcement, not newly introduced persistence
access. No wildcard or global exemption was added. A regression fixture verifies that a
protected command route cannot reach unrelated persistence through a helper.

Unprotected framework routes are classified in the inventory: application layout,
login/install/offline and root composition remain with 25B; NextAuth's protocol handler is
part of the auth gate; `/api/health` deliberately calls operational database health
infrastructure. Operational CLI scripts are inventoried but not treated as application
read services. No unclassified non-UI API routes remain.

## Validation

- Baseline: focused Assistant/Teams/Players/global services/shared queries/architecture suite,
  `SKIP_DB=true npm run test:run -- src/features/assistant src/features/teams src/features/players src/lib/services src/lib/db/queries src/tests/architecture --maxWorkers=2 --testTimeout=30000`:
  **407 tests / 41 files passed**.
- Initial Assistant/Team migration: **77 tests / 13 files passed**.
- Adapter-retirement pass identified obsolete test mocks and one wrapper-only default call;
  corrected the test boundaries while preserving runtime behavior.
- Final focused suite: **1,041 tests / 113 files passed**.
- Final Rounds/Standings/Managers export cleanup: **496 tests / 67 files passed**.
- Full suite: **2,836 passed, 8 existing skips / 339 passing files**.
- Full verifier: skills, architecture, docs, typecheck, tests and lint passed
  (24 existing image warnings, zero errors), production build, schema metadata and Drizzle checks passed.
  The final source state repeated the complete verifier successfully.
- `npm run test:e2e:local -- tests/e2e/lineup-ownership.spec.ts --project=iphone-13`: **1 passed**.
  The disposable runner also passed PostgreSQL multi-season integrity checks, built the
  production app, and cleaned up its temporary server/database. The test verifies real
  fixture login, squad/total-value parity with the Managers HTTP contract, private caching,
  no browser/API errors and no horizontal overflow. No provider request or mutation is made.
- `SKIP_DB=true npm run test:run -- scripts/architecture src/tests/architecture/ownership-inventory.test.ts --maxWorkers=2`: **16 passed / 2 files**.
- `node scripts/architecture/ownership-inventory.mjs > /tmp/task25-ownership-inventory.json`: **passed**, 1,109 modules and no computed references.
- Scoped Prettier checks and `git diff --check`: **passed**.

No active SQL implementation, schema, production data, environment, credentials or provider
mutation policy changed. Disposable PostgreSQL query tests are not required for unchanged
SQL; schema metadata and Drizzle consistency remain required in full verify.

### Exact focused commands

The first two commands are historical checkpoints; their legacy test paths were subsequently retired.

```bash
SKIP_DB=true npm run test:run -- src/features/assistant src/lib/services/features/__tests__/assistantContextService.test.ts src/features/teams --maxWorkers=2 --testTimeout=30000
SKIP_DB=true npm run test:run -- src/features/assistant src/features/teams src/features/managers src/features/market src/features/search src/features/rounds src/features/provider src/features/lineup src/lib/db/queries src/app/api/user src/app/api/market src/tests/architecture src/features/schedule/boundary.test.ts src/features/news/boundary.test.ts src/features/standings/server/standings-boundary.test.ts src/features/players/architecture.test.ts --maxWorkers=2 --testTimeout=30000
SKIP_DB=true npm run test:run -- src/features/rounds src/features/standings src/features/managers src/features/market/architecture.test.ts --maxWorkers=2
npm run verify
```

Results in order: 77, 1,041 and 496 passing focused tests; full verifier passed.
The verifier runs skills, architecture (1,059 source modules / 119 protected entrypoints),
docs (127 notes), typecheck, all tests, lint, production build, schema metadata audit,
Drizzle consistency and diff checks. Metadata reported no missing/extra schema elements.
The expected absent-provider notices and 24 existing image lint warnings remain visible.

No screenshot baselines were created or updated. Pixel-level and desktop/phone/PWA combined
visual acceptance remains with 25B/Task 26; the changed page contains only a data-import change.
The implementation and receipt are committed locally in the ownership-closure worktree;
no merge, remote push or deployment has been performed.

## Outstanding gates

25B must reconcile shell/layout/Section adapters, UI barrels (including the two unresolved
exports), tokens and visual ownership after Tasks 23–24 integrate. Authentication/credential
exceptions require their separate security acceptance. The known Market phone-bids defect
and Linux/production visual acceptance remain in the master tracker. These are not silently
accepted as resolved by 25A, and Task 25 as a whole remains open.
