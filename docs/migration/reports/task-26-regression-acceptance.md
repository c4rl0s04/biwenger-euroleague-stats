---
title: Task 26 regression acceptance
description: Exact-candidate regression evidence and unresolved acceptance gates after Task 25.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 26 — Regression acceptance

Base: main `ebc4da6d`, including Task 25 authentication ownership (PR #52).
Current code/CI candidate: `9ae1b9fd` (following test corrections `57b97367` and `ed23dadc`) on `chore/regression-acceptance`,
[draft PR #53](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/53).
This task verifies the architecture migration; UI implementation remains with its owner.
Task 26 is not accepted: reproducible macOS visual failures and explicit acceptance decisions remain. No deployment or production operation is performed.

## Baseline failure and correction

[Main CI](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36338510556)
failed typecheck because the Rounds boundary test still required six retired authentication
exceptions per page. TypeScript inferred the now-empty JSON array as `never[]`; the test
would also have failed its old count assertion. This prevented the browser build from
reaching its tests. Formatting, architecture and lint passed on that baseline.

The correction asserts zero exceptions and continued use of the deliberate authentication
contract by both Rounds pages. It preserves the page/API registration assertions and
mobile presentation checks. The focused Rounds file passed all three tests. The first full candidate run then
found two more stale exception-count assertions (Dashboard and Season Review) and two
Market suites still mocking the deleted layout barrel. These now assert zero exceptions
and mock the direct Section import. All 39 tests in the five affected files passed in
the pinned Linux image with the corrected source mounted read-only. No runtime code
changed and no assertions were skipped.

## Acceptance matrix

| Coverage                                                                                             | Evidence / remaining work                                                                                                                              |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Skills, architecture, lint, typecheck, docs, full unit/API/security tests, schema metadata and build | PASS on `ed23dadc`: 2,872 tests passed / 8 skipped; typecheck, lint, architecture, docs, metadata/Drizzle and production build passed.                 |
| Linux desktop, tablet, phone and landscape                                                           | PASS on `9ae1b9fd`: four shards total 261 passed / 27 expected fixture/project skips, across all nine configured projects.                             |
| macOS desktop and phone screenshots                                                                  | FAIL: default fixture 48 passed / 4 skipped / 12 screenshot failures; populated Market 1 passed / 1 screenshot failure. Original references preserved. |
| Populated Market                                                                                     | PASS: dedicated Linux CI matrix job using `--fixture=market` and `market-populated.spec.ts`; all nine projects passed (3.1 minutes on `9ae1b9fd`).     |
| Phone Market bids                                                                                    | Known pre-existing non-iterable duel object; scoped correction decision requested. It remains a blocker until resolved or explicitly dispositioned.    |
| Missing original Linux screenshots                                                                   | Semantic tests do not replace missing visual references; gaps listed below remain explicit.                                                            |
| Deployment and production smoke                                                                      | Task 27, not inferred from preview success or a skipped smoke workflow.                                                                                |

The local `npm run verify` passed skills, architecture and docs. Its slow typecheck was
stopped after candidate CI passed typecheck; remaining standard checks use the CI evidence
rather than claiming the interrupted local verifier passed.

[Candidate CI](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36340208644)
is the final code/CI run for `9ae1b9fd` (PR merge ref). Four default-fixture shards cover all 288 cases; the separate populated-Market job covers nine. Earlier unsharded runs were cancelled after supersession, not reported as passing.
The initial local browser attempt failed before starting because a reused dependency worktree disappeared. Dependencies were installed independently with `npm ci`; the retry passed disposable PostgreSQL integrity checks, built successfully, and completed the browser runs below.

Local browser commands use a clean, environment-free worktree and disposable databases;
no provider mutations or production credentials are involved.

## Visual provenance and retained gaps

Existing Linux Matches/Team references remain enforced. Manager Profile, Rounds, Home,
News, Dashboard, Compare, Standings, Schedule, Predictions, Playoffs, Tournaments and
Market screenshot assertions are macOS-only in the current specs. These Linux reference
gaps must not be filled using migrated output and then described as pre-migration proof.
Their original-source references require a separate provenance-preserving capture or
an explicit acceptance decision. No screenshot was updated to conceal a regression.

Task 25 UI-owned compatibility adoption remains separate. Passing this candidate cannot
establish acceptance for later UI-agent commits; affected checks must be rerun after
those integrate. Task 27 still requires release/deployment reconciliation.

## macOS failure evidence and next owner

Commands (all use disposable local databases):

- `npm run test:e2e:local -- --project=iphone-13 --project=desktop-1440`: 48 passed, four expected project/fixture skips, 12 screenshot failures (6.9 minutes of browser execution).
- `npm run test:e2e:local -- --fixture=market tests/e2e/market-populated.spec.ts --project=iphone-13 --project=desktop-1440`: desktop passed; phone overview screenshot failed (569 differing pixels).
- `npm run test:e2e:local -- tests/e2e/rounds.spec.ts tests/e2e/standings.spec.ts --project=iphone-13`: both phone failures reproduced, with the same 524/367 differing pixels.

All 13 failures are screenshot comparisons, not an exception from the auth or service layer.
An early screenshot assertion stops the rest of that test, so later interactions in those
macOS tests are not claimed as verified. Linux semantic coverage remains separate evidence.

| Viewport                      | Failing reference                     | Differing pixels |
| ----------------------------- | ------------------------------------- | ---------------- |
| Desktop 1440                  | `playoffs-overview.png`               | 9569             |
| iPhone 13                     | `standings-progression.png`           | 367              |
| Desktop 1440                  | `manager-not-found.png`               | 17793            |
| Desktop 1440                  | `predictions-overview.png`            | 9538             |
| iPhone 13                     | `rounds-lineup.png`                   | 524              |
| Desktop 1440                  | `market-empty-overview.png`           | 10086            |
| Desktop 1440                  | `standings-ranking.png`               | 11081            |
| Desktop 1440                  | `tournaments-catalogue.png`           | 104988           |
| Desktop 1440                  | `schedule-overview.png`               | 9293             |
| Desktop 1440                  | `manager-profile.png`                 | 8498             |
| Desktop 1440                  | `compare-desktop.png`                 | 106237           |
| Desktop 1440                  | `rounds-overview.png`                 | 10000            |
| iPhone 13 (populated fixture) | `market-populated-phone-overview.png` | 569              |

Reviewed examples: [Rounds phone diff](task-26-visual-evidence/rounds-lineup-diff.png),
[Standings phone diff](task-26-visual-evidence/standings-progression-diff.png), and
[Manager Profile desktop diff](task-26-visual-evidence/manager-profile-diff.png).
The inspected desktop Manager Profile, Compare and Tournament diffs are dominated by the
merged shell header/sidebar/footer changes; some smaller content differences also need
review. The phone differences concentrate around text. Their cause is not yet established.
Do not treat this as authorization to regenerate references or as proof that all differences
are harmless. UI owner review is required, keeping the approved shell separate from
architecture behavior. No thresholds, masks or snapshots were changed in this task.

Full traces/screenshots are retained locally in `/tmp/task26-macos-default-evidence` and
`/tmp/task26-macos-market-evidence`; these temporary directories are not permanent CI artifacts.
The three committed diff images preserve representative review evidence.

Outstanding decisions: the master tracker explicitly requires a scoped behavior decision
for the pre-existing Market phone-bids crash. That decision was requested and remains
unanswered. Acceptance of Linux semantics plus existing macOS references versus recovery
of original Linux screenshots was also requested, with no acceptance inferred from silence.

## Final verification disposition

The complete [code/CI candidate run](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36340208644)
passed. Default Linux shards reported 67/65/64/65 passes and 5/7/8/7 skips respectively.
The separate populated Market job passed nine cases. No flaky-retry result was reported.
The default fixture's nine populated-Market skips are covered by that separate job; other
skips remain explicit project-specific conditions rather than silently counted passes.

Standard CI passed formatting, skills, architecture, lint, typecheck, docs, all 2,872 unit
tests (eight existing skips), schema metadata/Drizzle checks and the production build.
Local documentation and diff checks passed for this receipt. The evidence-only follow-up
commit changes documentation and diagnostic images; it does not change the validated code.

Acceptance is **not complete**. Resolve/review the 13 macOS screenshot failures, decide the
known bids defect, and decide original Linux visual-reference coverage before marking
Task 26 complete. Do not merge this draft as an assertion of full acceptance or advance
Task 27 on the strength of green CI alone. No application behavior or visual reference
was modified by these test and CI corrections.
