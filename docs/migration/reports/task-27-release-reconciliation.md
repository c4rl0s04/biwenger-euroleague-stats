---
title: Task 27 architecture release reconciliation
description: Exact-merge architecture acceptance, production provenance and remaining verification limits.
audience:
  - maintainer
  - contributor
status: active
---

# Task 27 architecture release reconciliation

Verified on 2026-09-28. Branch: `docs/task-27-release-reconciliation`.
Worktree: `../biwengerstats-next-task27-release`.

## Decision and scope

The architecture release at `d6d268cae2aa6661b4c9a6c48b0a6f1fc0eafbe6`
is integrated, passes exact-merge CI, and was successfully deployed to production.
Task 27 reconciles architecture acceptance; it does not implement sync functionality,
complete UI adoption, or authorize provider writes, schema changes or deployment changes.
This documentation-only receipt still needs integration; it does not claim its own commit
has been deployed.

PR #55 (`016d2488`) and PR #58 (`d6d268ca`) are confirmed ancestors of remote main.
The former closes shared competition, feature helper and Accounts persistence ownership;
the latter closes Lineup/Schedule rule residue, offer projections, nullable Schedule inputs
and Hoopgrid CLI persistence. Prior reports remain historical implementation evidence.

## Exact release evidence

- [PR #58](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/58)
  merged the final ownership closure at the exact architecture SHA above.
- [Architecture-merge CI](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36356056539)
  completed successfully on that SHA: formatting, Test & Build, all four default browser
  shards and the Market browser job passed.
- [Architecture-merge deployment smoke](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36356138427)
  completed successfully on the same SHA.
- [Architecture production deployment](https://vercel.com/carlosandreshuete-1394s-projects/advanced-euroleague-biwenger-stats/BdDEJfuZKcN11TkivC7e8smgXDK9)
  was inspected through Vercel: `dpl_BdDEJfuZKcN11TkivC7e8smgXDK9`, READY,
  production target, main branch and exact matching architecture SHA.

At inspection, remote main and the current production alias both resolve to
`fbda5b280b293ed38f8df921d50534215fc0178f`. Current deployment
`dpl_2FSwC5a3gLGvgMXFkporm3C2q8f3` is READY with production target.
The descendant diff from the accepted architecture merge contains only roster portrait
JSON and UI documentation (PR #59), with no application runtime changes.
Its [deployment smoke](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36468299613)
also passed. Its [CI run](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/36468189394)
was still running at inspection; this receipt does not describe that run as successful.
The primary local checkout remains at the accepted architecture merge; it was not reset.

## Ownership and retained code

Feature rules belong to their domain owners, including Lineup selection and offer logic,
Market bidding and Accounts password persistence. Reused competition calculations and
minimal reads have explicit client-safe `public.ts` and server-only `server.ts` contracts.
The architecture policy has no exceptions and enforces the retired helper boundaries,
shared-domain dependency direction and client/server separation.

Database and season infrastructure, synchronization/provider infrastructure, authentication
protocol adapters and credential infrastructure remain deliberate owners. The unused
fantasy-scoring formula remains a reference, not a runtime migration dependency.
Live presentation compatibility belongs to the separate UI adoption track. Import checks
are not proof that arbitrary inline logic cannot exist; the bounded semantic ownership
review and fixes in the preceding receipts complement the automated checks.

## Verification and limitations

- `git merge-base --is-ancestor` for both ownership merges against `origin/main`: passed.
- `git diff --stat d6d268ca..origin/main`: only the documented data/documentation descendants.
- `npm run architecture:check`: passed, 1,072 modules and 125 protected entrypoints.
- Baseline `npm run docs:check`: passed, 136 vault notes.
- Final `npm run docs:check`: passed, 137 vault notes.
- `npm run skills:check`: passed for all six repository skills.
- `git diff --check`: passed.
- `npm run smoke:deploy -- https://advanced-euroleague-biwenger-stats.vercel.app`:
  passed 4/4 on 2026-09-28 at 18:56 UTC: health/database health 200, login SSR 200,
  public landing statistics 200 and landing redirect 307. These are read-only requests.
- Vercel project runtime-error inspection with `since: 1h`: no runtime errors returned.
  This is a bounded project-wide observation, not exhaustive historical or authenticated coverage.
- Full runtime/build/browser acceptance uses the successful exact-merge CI linked above;
  those suites are not rerun for this documentation-only reconciliation. No snapshots changed.
- No new authenticated production browser walkthrough or provider mutation was performed.
  Existing desktop/phone fixture evidence remains in the Task 26 and ownership receipts.

Documentation integration is the remaining handoff. UI feature migration and any operational
sync defect are independent work, not reopened architecture acceptance requirements.
