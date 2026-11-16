---
title: Shared statistics list implementation evidence
description: Distinct foundation-based manager, distribution, player and activity list families replacing the legacy StatsList.
audience:
  - contributor
  - maintainer
  - agent
status: draft
---

# Shared statistics list implementation evidence

Implementation date: 23 October 2026. Local verification is not integration or production deployment.
This follows the user's statistics-list plan and is stacked on the existing Rounds UI migration.

## Review order

1. The score prerequisite and existing UI stack: PR #119, then #121, #122 and #123.
2. [Shared manager identity and compact records, PR #124](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/124).
3. [Analytical rows and Standings adoption, PR #125](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/125).
4. Player rankings, local activity/context rows and legacy removal, based on batch 3's predecessor.

Existing PR branches were not modified, merged or deployed. Each new PR is a draft with an explicit
stacked base; retarget after integrating its prerequisite and require passing CI before merge.
Do not enable auto-merge that bypasses unfinished checks on an unprotected branch.

## Component boundaries

Shared presentation is exported through [competition UI](../../../src/lib/competition/ui.ts),
using foundation primitives. There is no universal card renderer, row-mode switch, generic list
engine or data-shape dispatcher.

| Family                          | Ownership and layout                                                                        | Consumers                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ManagerIdentity                 | Shared competition; linked avatar/name, manager-color identity, optional supporting content | Compact rankings, distributions and local manager breakdowns                             |
| ManagerStatList                 | Shared competition; ordered compact rank/identity/metric rows                               | Six Rounds record cards and compatible Standings rankings                                |
| ManagerDistributionList         | Shared competition; identity above full-width visualization                                 | Rounds Consistency and Perfect Rounds, each with its own chart/legend                    |
| PlayerIdentity / PlayerStatList | Shared competition; separate player link and metadata, feature badge and metric             | Dashboard Top Players, weekly MVPs and statistical leaders                               |
| TransferActivityList            | Dashboard-owned event layout with independent player/seller/buyer links, amount/date        | Market Activity                                                                          |
| Contextual player lists         | Remain local, preserving form chips, advice, age, improvement and streak layouts            | Top Form, Captain Suggest, Market Opportunities, Birthday, Rising Stars and Streak cards |
| Specialized manager rows        | Remain local; use ManagerIdentity, with their own supporting graphics/detail                | Draft contribution breakdown and Volatility                                              |

The existing DashboardPlayerRow used by IdealLineupCard is a separate, fixed-height three-line
composition and was not converted into a universal row or expanded into this migration.

## Typed contracts

The shared lists accept typed readonly items, explicit stable-key and identity selectors, and narrow
metric/badge/visualization renderers. Generic item types flow into callbacks; they do not erase metric
fields to a minimal identity type or use any-based public contracts.

Identity mappings specify the real manager/player ID. Zero IDs remain valid; missing identities
render text without invalid links. Player metadata remains outside its link so an owner link can be
independently operated. List renderers do not fetch, sort, limit, calculate scores, infer database
records or change API contracts. Feature callers retain those responsibilities and their existing
headers, explanations, units, metrics, icons and ordering.

Manager colors are separate from statistic accents. Identity and migrated metric text use semantic
content contrast in both themes. Shared rows use native list markup, content-sized spacing, visible
focus and foundation empty states. Distribution rows give visualization content its own reading line;
transfer activity is an unordered event list rather than a manager-ranking variant.

## Migration coverage and compatibility

Audited 27 direct legacy callers: ten Dashboard cards, sixteen Standings cards and the Rounds-only
wrapper used by eight cards. All moved to the appropriate shared or local composition. The old
StatsList implementation/export and RoundRankingList wrapper are removed after the caller audit.
Unrelated tournament variables named globalStatsList are data variables, not UI consumers.

Draft Fidelity's hover-only contribution tooltip is now the existing foundation Popover with keyboard,
Escape and touch access. Volatility preserves its supporting indicator and renders zero maximum as
zero width rather than a nonfinite CSS value. Bottler retains second/third-place counts.

AnimatedNumber's JSDoc now describes its actual props object so the new typed activity component can
consume it; animation runtime/formatting is unchanged. No service, query, score formula, cache,
provider, schema, authentication or URL changes were made. This is a list migration, not a full-page
Dashboard or Standings redesign. Phone's dedicated compositions remain in place.

## Verification record

Commands run in the isolated sibling worktree with Node 24.20.0 and locked dependencies. No provider
environment files were copied and no production database operations were performed.

- Setup: `npx --yes --package=node@24.20.0 -c 'node scripts/dev/worktree.mjs setup'` passed.
- Batch 1: `npm run test:run -- --maxWorkers=2 src/features/rounds src/lib/competition` passed
  228 tests / 33 files. `npm run architecture:check`, `npx --no-install tsc --noEmit`, focused
  ESLint/Prettier, commit hooks and `git diff --check` passed.
- Batch 1 browser: the disposable runner on desktop-1280 with `rounds-live.spec.ts --grep
"history controls"` passed one dark/light case, including all six record links.
- Batch 2: rounds/standings/competition unit scope passed 431 tests / 60 files; architecture,
  typecheck and focused static checks passed. The disposable runner with `rounds-live.spec.ts
stat-list-families.spec.ts --project=desktop-1280 --grep "history controls|standings retains"`
  passed two cases covering distributions, breakdown keyboard access, zero volatility and podium counts.
- Combined unit scope: `npm run test:run -- --maxWorkers=2 src/features/rounds src/features/standings
src/features/dashboard src/lib/competition` passed 491 tests / 69 files.
- `npm run db:audit:schema:metadata` and `npx --no-install drizzle-kit check` passed (39 matching tables).
- Final static checks: `npx tsc --noEmit`, `npm run architecture:check` (1,129 modules / 132
  protected entrypoints), `npm run docs:check` (142 notes), focused ESLint and Prettier, and
  `git diff --check` passed. The source audit found no remaining legacy list imports or exports.
- Visual references updated: four Dashboard section captures and Rounds comparison on desktop-1440.
  Representative compact, analytical, contextual-player and activity captures were reviewed in both
  themes. Phone references and Standings overview references remain unchanged.
- Final disposable browser command: `npm run test:e2e:local -- rounds-live.spec.ts rounds.spec.ts
stat-list-families.spec.ts standings.spec.ts dashboard.spec.ts --project=desktop-1280
--project=desktop-1440 --project=iphone-13`. Results are recorded in the final PR.
  CI is pending until the hosted checks finish.

Initial local issues were corrected: a CSS-module import was rejected by the existing competition
boundary checker, so the implementation uses semantic utilities without changing enforcement;
renderer tests isolate the unrelated legacy UI barrel, and JSX component imports support the
classic test transform; the new typed activity consumer exposed AnimatedNumber's inaccurate
JSDoc, which was corrected. A final browser recheck caught a stale Top Form owner-color reference after the contrast adjustment; the reference was removed before the final validation. Final results supersede those initial failures.

## Required review limits

Review representative compact manager, analytical, player, contextual-player, transfer and draft
breakdown states in both themes. Preserve current routing, zero/negative/missing values, rank badges,
independent links and narrow-width behavior. Fixture browser results do not constitute a production
provider audit or a complete cross-platform/WCAG audit. Keep all PRs unmerged until required checks
pass and the user authorizes integration.
