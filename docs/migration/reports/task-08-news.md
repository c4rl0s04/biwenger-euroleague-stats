---
title: Task 08 News
description: News read ownership, preserved contracts and local acceptance evidence.
audience:
  - maintainer
  - agent
status: active
---

# Task 08 — News

Base: `b7505a29`. Branch: `refactor/news-feature-architecture`.
Implementation commit: `136a139c`.
Worktree: `../biwengerstats-next-news-feature-architecture`.
Original implementation details below are historical; current integration evidence follows.
Task 09 has not started.

## Integration — 2026-09-22

Fetched main `4929e03509fe3d1d5042b0747ea19c6b90a4d76e` adds only the independent
historical-price sync correction and its tests. Both checkouts were clean. Rebase was conflict-free:

- `136a139c` → `5fd8c962` (News implementation).
- `eb46d951` → `69dfa07f` (acceptance documentation).

`git range-diff` confirms identical patches for both commits. Local main was fast-forwarded to
`69dfa07f`; this documentation commit accompanies normal GitHub publication. No force push,
merge commit, unrelated feature integration, application correction or configuration change was needed.

Combined-source validation passed:

- `npm run verify`: skills, architecture (993 modules / 83 protected entrypoints), documentation,
  typecheck, 2,470 tests plus one existing skip, lint (zero errors / 24 existing warnings),
  database-disabled production build, schema metadata audit, Drizzle check and diff check.
- The focused News/Matches/Market/Dashboard/API command listed below: 364 tests / 41 files passed.
- `npm run test:e2e:local -- news.spec.ts dashboard.spec.ts feature-screens.spec.ts`:
  27 cases passed across nine projects; original screenshots unchanged. Disposable local database
  and application were stopped normally. No production operations occurred.
- `git diff --check origin/main..HEAD`: passed before integration.

Expected missing-provider build notices remain. No browser failures occurred in this integration run.
Linux News screenshot references and real-production-data visual review remain outstanding.
Vercel deployment was not inspected under the GitHub-only release workflow; this is not a claim
of production readiness verification. No Task 09 or theme work was included.

## Ownership and compatibility

News owns the desktop ticker, phone Dashboard strip, mobile projection, feed model, formatting
and sequential aggregation. AppShell and Dashboard retain placement through the News public contract.
The Dashboard Server Component and existing `/api/news` handler share the News server service.
There is no News page, database table, ingestion pipeline or provider request.

News calls Market's existing transfer/price services and Matches' new feed-read services. Only the
two upcoming/result queries moved from the legacy match module. Their season resolution, inner joins,
date/status predicates, ordering and limits remain unchanged. Other Team helpers remain untouched.
Matches maps database dates to serializable strings and retains nullable names/scores/dates.

The feed retains `type`, `text`, `timestamp`; transfer timestamps remain number/string/null.
Spanish wording, null coercion, server-local date formatting, five transfers, `(24, 200000)` price
arguments, three upcoming matches, three results and random-sort mixing are preserved. The price
hours argument remains unused in Market. Independent catches retain partial feed results and empty
success when all reads fail. Clock/random dependencies are injectable; production defaults are unchanged.

The parameterless API remains public and identity-independent, `force-dynamic`, with success
`public, max-age=300, stale-while-revalidate=60` and private/no-store 500 errors. No new input rules,
server cache or browser storage cache were introduced. Existing route error messages/log behavior
remain unchanged; this structural slice is not an error-policy redesign.

News output uses explicit allowlists, not raw records. The mobile mapper retains the first three
items, positional ID fallback, nullish text fallback and deliberate empty strings. NewsTicker was
renamed from `.js` to `.jsx` for JSX-aware test imports without changing its rendering/request body.
Landing statistics remain in the legacy landing module for their separate migration. Unused News
service re-exports and old widget paths were removed. Both Dashboard News exceptions were removed;
the architecture checker now protects `/api/news` without additional exceptions.

The unused AppShell re-export was removed from the generic layout barrel: otherwise a feature
importing Section also reached AppShell → News → Market/Matches, forming a dependency cycle.
The sole AppShell consumer already imports it directly. Both architecture checkers remain unchanged;
a regression test protects this composition boundary.

## Baseline

- Original main and worktree were clean at creation.
- Baseline `npm run verify`: architecture, docs and typecheck passed; full suite had 2,436 passes,
  one existing skip and one timeout in the existing MapLibre asset-copy test. A focused retry also
  exceeded its unchanged five-second timeout. No unrelated test/configuration was edited.
- Original disposable production build passed. Initial News browser run captured both references;
  desktop passed, phone exposed an incorrect new test expectation of exactly three fixture items.
  The fixture actually produces one; the assertion was corrected to one-to-three plus matching count.
- Repeated original-source `news.spec.ts` on iPhone 13 and desktop 1440 passed both cases without
  updating images, before application edits. Desktop uses a fixed synthetic HTTP response and frozen
  marquee animation; phone uses real fixture reads and masks only the randomly selected headline.
  Phone expansion and content are verified semantically, not by masking the expanded list.

## Acceptance checklist

- [x] Original visual references captured and compared before migration.
- [x] News and Matches contracts implemented; legacy consumers updated.
- [x] Architecture graph passes: 993 modules, 83 protected entrypoints.
- [x] Focused contracts, full verifier and candidate browser comparisons pass.
- [x] Logical local commits; no integration or publication.

No production database, sync, credentials, environment settings, dependencies, or schema changes
are part of this task.

## Final validation

| Command                                                                                                                                                                           | Result                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `npm run verify`                                                                                                                                                                  | PASS, complete workflow                                            |
| `npm run typecheck`                                                                                                                                                               | PASS via verifier                                                  |
| `npm run test:run -- --maxWorkers=2`                                                                                                                                              | PASS, 2,469 tests / one existing skip                              |
| `npm run test:run -- src/features/news src/features/matches src/features/market src/features/dashboard src/app/api/news src/app/api/__tests__/misc-routes.test.ts --maxWorkers=2` | PASS, 364 tests / 41 files                                         |
| `npm run test:run -- src/app/api/news src/features/news src/features/dashboard/boundary.test.ts --maxWorkers=2`                                                                   | PASS, 26 final guard tests                                         |
| `npm run lint`                                                                                                                                                                    | PASS, zero errors / same 24 existing warnings                      |
| `SKIP_DB=true npm run build`                                                                                                                                                      | PASS via verifier; expected absent-provider configuration warnings |
| `npm run architecture:check`                                                                                                                                                      | PASS, 993 modules / 83 protected entrypoints                       |
| `npm run skills:check`                                                                                                                                                            | PASS, six skills                                                   |
| `npm run docs:check`                                                                                                                                                              | PASS, 106 notes                                                    |
| `npm run db:audit:schema:metadata`                                                                                                                                                | PASS, 37 tables / no drift / offline                               |
| `npx --no-install drizzle-kit check`                                                                                                                                              | PASS, no migrations applied                                        |
| `npm run test:e2e:local -- news.spec.ts dashboard.spec.ts feature-screens.spec.ts`                                                                                                | PASS, 27 cases across nine projects                                |
| `git diff --check`                                                                                                                                                                | PASS                                                               |

Both original News images and existing Dashboard/Matches/Team references passed unchanged. The
ticker remains byte-identical; AST comparison against the base confirms unchanged phone rendering
and both moved query bodies. Tests verify anonymous and authenticated requests with ignored query
parameters, expansion/navigation and deliberate loading/empty/error behavior. No normal browser
error guard was loosened.

During implementation, the full architecture test detected the layout-barrel cycle described above;
removing its unused AppShell re-export resolved it without checker changes. An initial candidate
tablet test forced document navigation and reported WebKit prefetch cancellations. The test now
clicks the real Standings link; the complete repeated suite passes. The baseline MapLibre timeout
recurred once, then its isolated retry and final complete verifier passed with original timeouts.
The previously documented `The destination stream closed early` server message recurred during a
feature-screen browser case; all browser exception/API assertions passed.

Linux News image references and real-production-data visual review remain unverified. Public API
access and existing error-message/log behavior were intentionally preserved, not hardened here.
The implementation is ready for review, not a claim of integration or production deployment.
Recommended next task after acceptance: Task 09 Home; it has not started.
