---
title: Domain ownership closure before Task 27
description: Feature helper ownership, shared competition contracts and Accounts persistence cleanup.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Domain ownership closure before Task 27

Branch: `refactor/domain-ownership`. Base: main `4d9b2ba3`.
Worktree: `../biwengerstats-next-domain-ownership`.
Implementation is committed locally. Build/browser acceptance, integration and production acceptance remain pending; no merge or deployment is part of this change.

## Ownership and compatibility

- Lineup owns typed tactics, substitutions, normalization and rotation helpers through its public contract.
  Desktop/mobile clients change imports only.
- Market catalogue owns bidding tiers, rounding and labels; the existing player modal uses its internal helper.
- Shared competition public logic owns standings, match scores, ideal lineups, efficiency and form calculation.
  Its server contract owns uncached player form and active-season manager directory queries. SQL and result
  shapes are preserved. No feature, UI, provider or authentication dependency is allowed inside this module.
- Accounts owns its existing parameterized password lookup/update. Hashing, HTTP behavior, authentication,
  credential infrastructure and remaining synchronization mutations are unchanged.
- Retired global helper implementations have no compatibility exports. Fantasy scoring remains a test-only
  reference formula. Database connections, schemas, seasons, provider clients and sync remain infrastructure.

Architecture checks reject retired alias/relative imports, competition deep imports, forbidden dependencies,
computed imports and public/server leaks. The inventory distinguishes shared domain logic from infrastructure.
Historical migration reports are preserved; this receipt supersedes their ownership descriptions for these modules.

## Validation

- Baseline architecture check: passed, 1,063 modules and 125 protected entrypoints.
- Baseline focused tests on an unchanged `4d9b2ba3` archive: 63 passed across 9 files.
  Dependency installation initially prevented test execution; the unchanged archive was tested once setup finished.
- Initial migrated focused suite: 429 tests passed across 47 files.
- Updated account route contracts: 7 passed. Cold dynamic imports initially exceeded test timeouts,
  allowing late mock changes to interfere with subsequent tests; static imports retain the same assertions
  while keeping module loading outside timed test bodies.
- Full unit suite: 2,903 passed and 8 existing skips across 359 files.
- Differential checks against unchanged main: 800 lineup comparisons and 110 bidding comparisons matched.
  Standings, match-score, ideal-lineup and efficiency implementations are byte-for-byte identical;
  player-form and manager-directory SQL strings are unchanged.
- Runtime graph: 1,065 modules / 125 protected entrypoints. Broader operational inventory: 1,117 modules,
  zero exceptions and zero computed imports.

| Command                                             | Result                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run worktree:setup`                            | Passed with pinned Node 24.20.0; no environment files copied.                                                                                                                    |
| `npm run architecture:check`                        | Passed: 1,065 modules and 125 protected entrypoints.                                                                                                                             |
| `node scripts/architecture/ownership-inventory.mjs` | Passed: 1,117 runtime/configuration modules; no exceptions or computed imports.                                                                                                  |
| `npm run docs:check`                                | Passed; rerun after receipt updates.                                                                                                                                             |
| `npm run typecheck`                                 | Passed.                                                                                                                                                                          |
| `SKIP_DB=true npm run test:run -- --maxWorkers=2`   | Passed as part of verification: 2,903 tests, 8 existing skips.                                                                                                                   |
| `npm run lint`                                      | Passed: zero errors and 25 existing warnings.                                                                                                                                    |
| `npm run db:audit:schema:metadata`                  | Passed: 37 source/snapshot tables; no mismatches; no database connection.                                                                                                        |
| `npx --no-install drizzle-kit check`                | Passed.                                                                                                                                                                          |
| `git diff --check`                                  | Passed.                                                                                                                                                                          |
| `npm run verify`                                    | Incomplete: all stages through lint passed; the build was stopped with SIGTERM (exit 143) after over ten minutes compiling under heavy local memory pressure.                    |
| `RAYON_NUM_THREADS=2 SKIP_DB=true npm run build`    | Incomplete: lower-concurrency retry also stopped with SIGTERM (exit 143) after roughly ten minutes without finishing compilation. No application compilation error was reported. |

Two concurrent local builds coincided with approximately 13 GB of swap usage. The font endpoint
responded normally and compiler activity remained observable; memory contention is the likely
cause of the slow build, not a proven application defect. Only this task's build processes were stopped.
Neither interrupted attempt counts as a successful production build.

## Remaining acceptance

Browser scenarios were not run because the production build did not finish. The added Team-to-Player
navigation assertion is therefore unverified in a browser. No screenshot baselines were changed.
Do not mark this follow-up fully verified or proceed to final Task 27 acceptance on this evidence.

When local resources permit, finish the production build and run these disposable fixture commands:

```bash
RAYON_NUM_THREADS=2 SKIP_DB=true npm run build
RAYON_NUM_THREADS=2 npm run test:e2e:local -- --project=iphone-13 --project=desktop-1440 tests/e2e/lineup-ownership.spec.ts tests/e2e/market.spec.ts tests/e2e/rounds.spec.ts tests/e2e/feature-screens.spec.ts tests/e2e/home-architecture.spec.ts tests/e2e/standings.spec.ts
RAYON_NUM_THREADS=2 npm run test:e2e:local -- --fixture=market --project=iphone-13 --project=desktop-1440 tests/e2e/market-populated.spec.ts
```

These commands use synthetic loopback PostgreSQL fixtures; they do not authorize production operations.

No production data, provider operations, schema changes, deployment settings or visual baselines are changed.
Task 27 must verify CI and deployment against the eventual merged SHA.
