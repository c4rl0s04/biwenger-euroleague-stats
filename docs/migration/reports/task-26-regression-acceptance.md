---
title: Task 26 regression acceptance
description: Combined architecture regression corrections, visual provenance and release evidence.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 26 — Regression acceptance

The architecture implementation is integrated through Task 25. This task verifies that
combined application, corrects regressions and reconciles evidence; it does not require
completion of the separate feature-by-feature UI adoption project.

## Restore main

Main `ebc4da6d` failed TypeScript checking after PR #52 retired authentication exceptions
but left tests expecting them. The Rounds test inferred the empty exception array as
`never[]`, blocking both ordinary CI and the browser build. Dashboard and Season Review
also retained obsolete exception assertions; Market tests mocked a removed layout barrel.

[PR #53](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/53) corrects these tests,
shards the complete default browser suite into four jobs and adds a separate populated
Market fixture job. No runtime behavior, screenshot threshold or skip was changed there.
It merged at `0736b96d`:

- [Main CI](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36342653059): passed, including all five browser jobs.
- [Production deployment](https://vercel.com/carlosandreshuete-1394s-projects/advanced-euroleague-biwenger-stats/7u2qHpNapfsAmBygQAFYYAxMVZqL): READY, target production, exact main SHA and production alias confirmed.
- [Production smoke](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36342713741): passed.

Earlier skipped smoke jobs were expected: the workflow runs automatically only after a
successful production deployment, not after previews or failed builds.

## Remaining findings and corrections

[PR #54](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/54) contains the bounded
follow-up on `fix/task26-closure`:

- **Phone background:** AppBackground accepted but ignored presentationMode and covered
  the existing `.mobile-app` gradient with an opaque desktop canvas. Phone mode now leaves
  the phone-owned background visible. The palette contract checks that real owner and
  asserts its gradient. Original phone references are retained.
- **Desktop paint:** ambient effects and content now have explicit separate stacking
  levels. Captures wait for fonts, finite entrance animations and two paint frames before
  comparing images. This avoids accepting partially painted text as a new reference.
- **Phone bids:** the legacy page spread `biddingDuels`, which is an object containing
  users and a matrix. The page now invokes the typed Market section service. Its mapper
  emits record bids, unique nonempty rival pairs and overpayment rows, preserving the
  existing 20-row limit and empty state. Route guards still precede all reads; no HTTP
  contract, authentication policy, database schema or provider mutation changes.
- **Bids coverage:** focused service/page tests cover empty data, duplicate duel directions,
  row ordering, serialization and limits. Both empty and populated browser fixtures now
  navigate the bids section; the populated case requires a duel row.
- **Documentation:** the overview and tracker distinguish historical implementation
  milestones from current verification and release work.

## Visual provenance

The initial macOS run recorded 48 passes, four fixture/project skips and 12 default
screenshot failures, plus one populated-Market phone screenshot failure. Those failures
were not treated as passing simply because Linux CI was green. The original diagnostic
examples remain in [visual evidence](task-26-visual-evidence/manager-profile-diff.png).

Desktop references predated the already-merged Task 23 shell: header controls, sidebar
spacing and toggle, semantic surfaces, account avatar and footer changed in PR #49.
References are reviewed against those intentional changes after correcting paint issues.
They are current-shell regression references, not newly invented pre-migration evidence;
the original files remain available in Git history at `0736b96d`.

No screenshot threshold is loosened, no new mask hides content, and no failing route is
removed from browser coverage. Phone references are not regenerated for the background fix.
New bids behavior is checked semantically rather than claiming a pre-existing successful
screenshot of a route that previously crashed.

## Acceptance scope and retained coverage limits

Architecture acceptance uses the full unit/API/security and graph checks, all nine Linux
browser projects, populated Market coverage, and reviewed desktop/iPhone macOS visual
comparisons. Existing Linux Matches/Team screenshots remain enforced.

Original Linux references are still absent for Manager Profile, Rounds, Home, News,
Dashboard, Compare, Standings, Schedule, Predictions, Playoffs, Tournaments and Market.
These are explicitly retained visual-coverage follow-ups, not evidence of an incomplete
feature migration or proof of pixel parity on Linux. Recover original-source references
when extending that platform's visual suite; never label migrated output as original.
Real-production-data visual exploration and installed/offline PWA behavior also remain
outside the deterministic fixture checks, as documented in the testing guide.

Section/theme/mobile compatibility code still has live UI consumers. It remains owned
and supported during UI adoption. No dead global service adapter needs to be retained
for that reason, and no live presentation code should be deleted merely to reduce a
legacy directory count.

## Final verification

Task 26 is **verified and complete within the acceptance scope above**. All 13 initial
macOS screenshot failures are resolved; the bids crash is corrected and exercised.
The coverage limits above remain explicit and are not represented as passing comparisons.

Code candidate `f3f98371` passed [full CI](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36343448003).
Reference/capture candidate `16020bba` is covered by [the subsequent CI run](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36343899769)
and the local comparisons below.

| Check / command                                                                                                            | Result                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Full CI standard checks (skills, architecture, lint, typecheck, format, docs, tests, build, metadata/Drizzle)              | PASS: 2,876 tests passed, eight existing skips; 1,063 modules / 125 protected entrypoints / zero exceptions. |
| Linux default browser matrix                                                                                               | PASS: 261 cases / 27 expected project/fixture skips across nine projects.                                    |
| Linux populated Market job                                                                                                 | PASS: nine cases, including bids on phone projects.                                                          |
| `npm run test:e2e:local -- --project=iphone-13 --project=desktop-1440`                                                     | PASS on `16020bba`: 60 passed / four expected project/fixture skips, no screenshot updates, seven minutes.   |
| `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440` | PASS on `16020bba`: both desktop and iPhone passed, no snapshot updates (34.8 seconds).                      |
| Focused Market page/service and AppBackground Vitest suites                                                                | PASS: 22 tests.                                                                                              |
| Local `npm run typecheck` and `npm run lint`                                                                               | PASS: zero lint errors, 25 existing warnings.                                                                |
| Local `npm run db:audit:schema:metadata` and `npx --no-install drizzle-kit check`                                          | PASS; offline only.                                                                                          |
| Local `npm run docs:check` and `git diff --check`                                                                          | PASS before release.                                                                                         |

The initial local verifier exposed a test deliberately asserting the old bids crash. It was
replaced with the guarded successful service contract, and the subsequent full CI passed.
An overlapping typecheck initially raced Next's generated type files; its later standalone
rerun passed. Superseded diagnostic/capture runs are not counted as final acceptance.

Task 27 verifies the final integrated main SHA, production alias and post-deploy smoke.
Those release URLs and results are recorded in PR #54 after integration; preview success
alone is not production evidence.
