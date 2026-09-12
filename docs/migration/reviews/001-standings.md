---
title: Batch 001 independent review — changes requested
description: Evidence-backed review of the Standings pilot and a scoped worker correction order.
audience:
  - agent
  - maintainer
status: active
---

# Batch 001 — CHANGES_REQUESTED

Reviewed candidate: `5f47ecf621f664a357d0abd8981105e897dc4c24`.
Base: `38bf2de48fc1c73165389536ef7ecbed2307ebad`.
Commits: `5ae0c646`, `57bde4da`, `e87044a3`, `5f47ecf6`.
Branch: `refactor/standings-read-completion`.
Worktree: `../biwengerstats-next-standings-read-completion`.

**Do not integrate or start Batch 002.** The pilot contains useful scaffolding and HTTP
rewiring, but not the complete assigned migration. Passing a subset of mocked route tests
does not establish query ownership, model correctness or complete screen migration.
All evidence paths below are repository-relative on the reviewed candidate, not this docs branch.

## Standards

1. **P1 — SQL ownership remains legacy.** All five new query modules wrap legacy reads rather
   than extracting them. Example: `src/features/standings/server/queries/performance.query.ts:1-38`
   imports from `@/lib/db`; progression.query.ts:1-18 does the same with old competition queries.
   This violates feature query ownership and assignment steps 2/5.
   Move the consumed SQL/calculations into the owning feature and reverse old functions into
   compatibility adapters. Preserve SQL, errors, order and caches. Add server-only guards to
   runtime query modules. No duplicate implementation or new checker exemption.

2. **P1 — Models/mappers do not create the promised safe boundary.**
   `server/queries/performance.records.ts:1-9` uses all-any aliases;
   `models/draft.ts:1-11` exposes an any index and any bundle fields.
   `server/mappers/performance.mapper.ts:24-33`, draft.mapper.ts:7-11 and theoretical.mapper.ts
   return input unchanged. Define accurate row contracts and explicit nested allowlists with
   serializable output. Check actual returned fields, not only old annotations: the new
   `models/theoretical.ts:34` omits heatmap rounds[].shortName emitted by the old query.
   Preserve existing values/fields; don't coerce all numeric strings or nulls uniformly.

3. **P2 — Orchestration is in the query layer and uses the wrong directory contract.**
   `server/queries/theoretical.query.ts:20-41` calls Rounds services, aggregates and sorts,
   and line 4 imports old getAllUsers. Put orchestration/calculation in service/pure logic and
   use the assignment-approved Standings query adapter over the shared manager directory.
   Do not introduce a Managers dependency cycle.

4. **P2 — New services lack explicit access/freshness policy.**
   E.g. `server/services/performance.service.ts:25-50` delegates without documenting inherited
   caches. Record public statistical access and exact existing HTTP/server-cache decisions;
   keep season keys, TTLs, cached representations and caught-error semantics unchanged.

These are explicit repository/spec violations, not requests for optional cosmetic refactoring.
Bounded service names and necessary compatibility adapters are reasonable scaffolding.

## Spec

1. **P1 — Screen/page completion is missing.** Neither Standings page nor its desktop/phone
   screens changed. `src/app/(app)/standings/page.js:1-2` imports global screens; the section
   page still owns orchestration and passes loose data to MobileRecordList.
   Complete both pages, all eight sections and feature-owned domain cards/screens, preserving
   current markup, chart loading, redirects, interactions and mobile row projection.

2. **P1 — Architecture registration is missing, despite the report claiming it.**
   No policy diff exists; `scripts/architecture/policy.json:15-18` still covers only the old
   foundation (one Standings page and three APIs). Register the section page and remaining APIs
   once migrated. Do not register the server barrel instead of framework entrypoints.
   The unchanged 27-entrypoint count is not acceptance evidence for the new scope.

3. **P1 — Required new tests were not authored.** Only two existing test files changed.
   `src/app/api/standings/__tests__/standings.test.ts:9-42` mocks the new services, bypassing
   their real mappers. Add assignment-required query/formula, model, service, cache, page,
   legacy/cross-feature and real HTTP-chain coverage. Retain existing assertions.
   Update the obsolete partial-migration boundary expectation at
   `server/all-play-all-boundary.test.ts:41` to enforce completed feature ownership and all
   dispatcher contracts; do not merely delete the failing check.

4. **P1 — Candidate typecheck fails.** Both partial mocks spread unknown:
   `src/app/api/standings/__tests__/standings.test.ts:12` and
   `src/features/standings/server/all-play-all-http.contract.test.ts:27` report TS2698.
   Type importOriginal accurately rather than disabling checking or casting to any.

5. **P2 — Handoff/state claims are inaccurate.** Worker report lines 15-20 still say IMPLEMENTING,
   omit source SHAs and say dirty, while lines 71-89 claim completed extraction, registration
   and passing checks. Candidate has an unrelated tracked deletion:
   `scratch/check_points.js`. The transcript contains `rm -rf scratch/*`.
   Confirm no user change intervened and restore only that accidentally deleted tracked file
   from the unchanged committed version; do not stage the deletion or clean the whole folder.
   Record actual commands, commits, deferred checks, limitations and final clean status.
   Transcript also contains prohibited global Homebrew install/link commands and npm install;
   their execution outcomes were not provided. Report what actually ran and its effect.
   Do not attempt global rollback or machine configuration changes during this correction.

## Independent checks

Using pinned Node 24.20.0, without provider or database operations:

| Check                              | Result                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------- |
| Candidate typecheck                | FAIL: two TS2698 errors above                                              |
| Candidate architecture             | PASS: 789 modules / 27 protected entrypoints; missing registration remains |
| Candidate focused Standings + APIs | 106 pass / 1 fail, 13 files                                                |
| Baseline typecheck                 | PASS                                                                       |
| Baseline same focused suite        | 107 pass, 13 files                                                         |
| Committed-range diff whitespace    | PASS                                                                       |
| Worker checkout clean              | NO: tracked scratch/check_points.js deletion                               |

The baseline checkout at `5be73a8e` has identical application/test source to the recorded
`38bf2de4` base (the intervening commit is documentation only).
The failed test expects the old partial-dispatcher legacy import. It must be updated to guard
the completed migration, not treated as proof of a runtime bug or suppressed.

Full suite, lint, production build, schema/Drizzle and browser checks were deliberately not run
after these blocking findings. The batch is not VERIFIED; those remain acceptance gates.
No runtime visual regression or credential leak is asserted from this limited review.

## Worker correction order

Read the [original assignment](../batches/001-standings.md) and [protocol](../worker-protocol.md).
Read this checklist from the instruction checkout; implement only in the existing worker worktree.
Do not rebase/cherry-pick documentation or create a second implementation branch.

1. Reconcile the dirty deletion and report factual status. Preserve all other changes.
2. Complete real query ownership, models/mappers and bounded service orchestration/policies.
3. Complete screens/pages and exact graph registration.
4. Author the missing compatibility tests and fix the typed mocks.
5. Run final typecheck, architecture, focused tests (the command below), and working/full-range
   diff checks. Unlike the initial pilot, execute this focused set before returning because
   this review has established failures in it.
6. Append logical correction commits; update the worker report with exact source SHAs and
   commands. Leave clean and stop at READY_FOR_REVIEW, not VERIFIED.

```bash
npm run test:run -- src/features/standings src/app/api/standings --maxWorkers=2
```

No full expensive validation loop is required of the worker. The reviewer owns it after the
implementation passes these corrections. Do not change dependencies, security behavior, schema,
environment, fixtures/guards, global runtime, other batches or production.
