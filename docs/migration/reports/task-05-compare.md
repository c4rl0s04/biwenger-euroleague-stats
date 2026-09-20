---
title: Task 05 — Compare read migration
description: Compare ownership, compatibility, access review and acceptance evidence.
audience:
  - maintainer
  - agent
status: active
---

# Compare read migration

Branch: `refactor/compare-read-architecture`.
Worktree: `../biwengerstats-next-compare-read-architecture`.
Base: fetched `6aa275b6c5c7ae2138a530888093ef30230a4234`.
Implementation is local only; no merge, push or deployment is part of this task.
Implementation commit: `70c325c7`. Status: **verified locally**, ready for integration review.

## Scope and ownership

- `/compare`: unchanged desktop browser loading and phone opponent picker.
- `/compare/[userId]`: existing phone detail; desktop redirect remains before data reads.
- `GET /api/compare/data` and `GET /api/compare/data/lite`: preserved full/lite HTTP contracts.
- Compare owns typed models, common/advanced orchestration, squad-summary/prediction mapping,
  selection semantics, opponent projection, desktop/phone screens and head-to-head calculations.
- Managers owns the extracted comparison directory and statistical squad SQL, row interfaces,
  allowlisting mappers and services. Its ordinary directory cannot substitute: Compare uses
  `status <> 'inactive'`, name-only ordering and uncoerced identity, not active-only status,
  an additional ID tie-break or forced string conversion. The squad aggregation also differs
  from the existing owned-player and enriched-squad projections.
- Rounds, Standings, Predictions and public Market retain their own calculations and queries.
  Compare uses only their deliberate server/public contracts. Standings adds type-only exports
  for the statistical models already returned by its services.
- Both original SQL projections are unchanged apart from whitespace. Full/lite share their
  common implementation; lite never calls the advanced-data service.

## Access, caching and threat review

The API handlers ignore query parameters and cookies and receive no session-selected identity.
They return the league directory, standings, historical fantasy performance, captain aggregates,
owned-squad statistical summaries, prediction aggregates and historical market statistics for
the same season-selected league. No account, credential repository, provider request, active
private bid or mutation participates in this flow. Parameters in the two extracted SQL reads
remain bound, never interpolated.

Managers captain/home-away HTTP routes use private headers because those routes may resolve
identity from a session. Compare instead calls the underlying services with each directory ID;
those services perform no authentication/session lookup and return only fantasy statistics.
Their HTTP policy is not an inherited hidden cache on a server function.

The existing public league-wide policy is retained, not expanded to new fields or callers.
Both APIs retain `force-dynamic`, successful 200 `{ success: true, data }` envelopes and
`public, max-age=300, stale-while-revalidate=60`. Errors retain status 500, the generic
`Failed to fetch comparison data` envelope and `private, no-store, max-age=0, must-revalidate`.
No shared Compare cache or React cache wrapper is introduced. The upstream Standings
season-keyed rivalry cache retains its 900-second lifetime.

Page authentication and phone-route guards remain unchanged. Personalized phone selection
stays outside the public data service. Neither endpoint adds session-specific data to its
publicly cached response. New tests exercise anonymous/cookie/query variants and field
allowlisting. This review is not a certification of unrelated upstream error logging:
existing upstream logs remain outside this read slice. Compare's own handlers no longer
print raw thrown objects, and three redundant client debug logs are removed.

## Compatibility and removals

- Desktop retains strict identity equality, first-user fallback, initial rival selection,
  loading/error states and browser API fetch. Phone retains string matching, nullish session
  fallback, blank unknown-manager output, existing self-selection and concatenated last-five
  histories. Malformed IDs are not newly parsed, normalized or rejected with a different status.
- Existing ranking/tie rules, historical form divisor, numeric conversions, nulls, field names,
  ordering and full/lite defaults remain unchanged.
- HeadToHeadCard moves from the old Rounds folder into Compare; its calculation body is extracted
  to a client-safe helper. AST comparison confirms the same body apart from debug-log removal.
- Global Compare and phone screen implementations are removed after consumer inspection.
  `LazyAdvancedStats` had no consumers and is removed; no live interaction used it.
- The old Compare service is a thin adapter for Assistant's remaining context builder.
  Task 20 owns its retirement. Assistant itself is unchanged.
- Four entrypoints are architecture-protected. Twelve exact existing auth/credential
  infrastructure edges for the two session-reading pages follow the established policy pattern;
  retirement belongs to the Accounts security gate. No Compare query exception is added.

## Acceptance evidence

- Baseline `npm run verify`: PASS, 2,236 tests and one existing skip; 24 existing image warnings.
- Original application browser capture: `npm run test:e2e:local -- compare.spec.ts --project=iphone-13 --project=desktop-1440 --update-snapshots`: 2/2 passed.
  Three macOS screenshots were captured from unchanged application source and visually inspected.
  The runner used only an isolated disposable database and synthetic league.
- Initial focused migration tests: 49 passed. Initial typecheck found a mismatched type name
  for the old empty bidding-duels fallback; corrected to its actual empty-summary contract.
  Initial server-only test import failures were fixed with test-local marker mocks; runtime
  guards were not weakened.
- Typecheck and architecture passed (951 modules / 69 protected entrypoints).
- Final focused command: `npm run test:run -- src/features/compare 'src/app/(app)/compare' src/app/api/compare src/features/managers/server/services/comparison.service.test.ts src/features/managers/server/queries/comparison.query.test.ts src/lib/services/features/__tests__/assistantContextService.test.ts --maxWorkers=2`: **51 passed in nine files**.
- Final `npm run verify`: **PASS**, exit 0. Skills (six), architecture (951 modules /
  69 protected entrypoints), documentation (99 notes), `npm run typecheck`,
  `npm run test:run -- --maxWorkers=2` (2,278 passed / one existing skip),
  `npm run lint` (zero errors / same 24 image warnings), database-disabled
  `npm run build`, `npm run db:audit:schema:metadata` (37 source/snapshot tables,
  no drift), `npx --no-install drizzle-kit check` and `git diff --check` all passed.
  Provider-configuration warnings match the baseline. No real database is used by these checks.
- Candidate `npm run test:e2e:local -- compare.spec.ts`: **9/9 passed**, including all
  three original macOS screenshots, phone opponent navigation and desktop rival selection.
  Browser error guards remain unchanged; the disposable database shut down normally.
- Pre-commit formatting/lint passed. A trailing space in the extracted SQL was removed;
  SQL token comparison remains unchanged. The committed-range diff check is also required
  and recorded at handoff, rather than relying only on the unstaged diff.

Linux screenshot references and authenticated real-production visual review remain explicit
follow-ups. Do not generate Linux references from migrated output.
The fixture has two managers; richer ranking/ID/failure cases are covered by unit contracts,
not claimed as populated browser scenarios. Production has not been exercised by this task.

## Integration recommendation

Integrate this slice independently after local acceptance and review rather than accumulating
unrelated feature migrations. It is a self-contained read boundary with a smaller rollback and
review surface; Dashboard can then start from the accepted main. Integration, remote CI and
production verification remain a separately authorized release.
