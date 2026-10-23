---
title: Rounds UI foundation implementation evidence
description: Staged rounds presentation migration, preserved contracts and focused validation evidence.
audience:
  - contributor
  - maintainer
  - agent
status: draft
---

# Rounds UI foundation implementation evidence

Implementation dated 23 October 2026. This records implementation and local verification, not
integration or production release. CI and user-authorized merges remain required.

## Review stack

The approved [implementation plan](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/120)
is implemented in three bounded stages:

1. [Page and section composition, PR #121](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/121),
   based on [score placeholders, PR #119](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/119).
2. [Workspace cards and compact select, PR #122](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/122),
   based on stage 1.
3. Analytics, tables, comparison controls and final visual verification, based on stage 2.

Integrate the score prerequisite before stage 1, followed by stages 2 and 3. Retarget stacked PRs
when necessary after their base merges. The documentation-plan PR is independent of runtime code.
Do not enable automatic merging that can bypass unfinished checks on an unprotected branch.

## Implemented presentation

- Foundation PageCanvas/PageHeader and PageSection/SectionHeader, including nested headings.
- Feature-owned RoundPageSection keeps original anchors and sidebar registration/cleanup.
- Feature-owned RoundCard composes Card anatomy while retaining each sporting card's content.
- Large centered selector panel, independent compact standings, court, captain cues, separate bench,
  score summary, Grada, leader portraits, four personal metrics and six record categories remain.
- Typed foundation Select shares keyboard/focus behavior with the legacy CustomSelect adapter.
  Existing legacy defaults remain; its JSX source is now named CustomSelect.jsx for renderer tests.
  The foundation popup portals above card and scroll boundaries.
- Feature comparison toolbar uses foundation controls and avatars; metric toggles remain independent
  and the last compared manager cannot be removed.
- Native top-layer Popover is shared by card information, heatmap cells and distribution details.
  Keyboard/touch disclosure replaces hover-only details; Escape/outside dismissal use browser behavior.
- Recharts remains; its data/series rules are unchanged. Chart surfaces, axes and tooltip text use
  theme-aware roles. Native table semantics retain sticky labels, scrolling and existing sort rules.
- Shared competition StatsList remains unchanged; RoundRankingList supplies rounds-owned identity
  presentation through its existing slot. Manager profile destinations retain real IDs.
- Theme-aware accents preserve actual orange, personal ideal green, global ideal purple and manager
  colors. White text remains intentional on the dark court and filled categorical visualization cells.
- Dedicated phone layout/navigation remains; rounds-scoped canonical backgrounds and default metric
  values correct inherited dark/white mobile styling in light mode. Empty-state text uses semantic
  theme colors; unrelated phone screens are unchanged.

No services, queries, scoring, provider operations, cache policies, authentication, schemas or URLs
were changed by these three UI stages. The inherited score-placeholder changes belong to PR #119.
Dormant CoachRatingCard/RoundMVPCard remain unused; they were not reactivated or globally redesigned.

## Focused verification

All commands run in isolated stage worktrees with locked dependencies and pinned Node 24.20.0.
Environment files and production credentials were not copied. Browser runs use disposable PostgreSQL.

- Setup: `npx --yes --package=node@24.20.0 -c 'node scripts/dev/worktree.mjs setup'` per stage.
- Stage 1: 148 focused rounds tests, architecture check, focused lint/formatting; two browser tests
  on desktop-1440/iPhone 13 including build/typecheck. Reviewed refreshed desktop headings/anchors;
  phone visual references unchanged.
- Stage 2: 151 focused rounds/select tests, architecture, typecheck, schema metadata/Drizzle checks;
  eight desktop-1280 browser cases including build/typecheck.
- Stage 3 unit command: `npm run test:run -- --maxWorkers=2 src/features/rounds src/components/ui/controls/Select.test.tsx src/components/ui/controls/Popover.test.tsx`.
  153 tests passed. Covers section anchors, select disabled/wrap navigation and legacy defaults,
  native disclosure wiring, comparison states and existing domain/service contracts.
- Stage 3 browser command: `PATH=/opt/homebrew/opt/postgresql@17/bin:$PATH npx --yes --package=node@24.20.0 -c 'npm run test:e2e:local -- rounds-live.spec.ts rounds.spec.ts --project=desktop-1280 --project=desktop-1440 --project=iphone-13 --project=iphone-se --update-snapshots'`.
  Initial full run: 24 passed, 20 desktop-only phone skips. The same command without
  `--update-snapshots` passed again on final source: 24 passed, 20 intentional skips. All existing
  screenshot comparisons passed. Four desktop references changed intentionally; phone references
  stayed unchanged. Reviewed dark history, light analytics and narrow-phone light captures.
- Additional focused historical capture run refreshes desktop references after final visual changes.
- A final visual inspection caught inherited black phone backgrounds and white metric values in
  light mode. The rounds-scoped correction then passed two additional historical browser tests
  with `rounds.spec.ts --project=iphone-13 --project=iphone-se`, without snapshot updates, including
  build/typecheck, background/text assertions, all phone detail routes and narrow-phone light capture.
  Dark phone references remain unchanged.
- `npm run architecture:check`: 1124 modules / 132 protected entrypoints passed.
- `npm run db:audit:schema:metadata`: 39 matching source/snapshot tables passed.
- `npx --no-install drizzle-kit check`, `npx --no-install tsc --noEmit`, focused Prettier/ESLint,
  `git diff --check` and commit hooks are recorded in the stage 3 PR.

Browser coverage includes quick/full loading, retry, stale responses, manager changes, global ideal
independence, slash versus zero, standings height, picker keyboard/boundary behavior, real comparison
membership, metric toggles, sortable headers, heatmap and distribution disclosures, section cleanup,
dark/light analytical captures, xl breakpoint overflow checks and narrow-phone navigation.

## Remaining gates and limits

- CI is pending for each stage; no UI stage is merged or deployed as part of this implementation.
- Production round data/sync failures are outside this migration and are not repaired by UI work.
- Local screenshots use synthetic data; they do not prove every real-world name/image combination.
- No claim of a full WCAG audit or a complete browser/platform matrix is made. Native popovers and
  portal placement are covered in the focused browser environment; unsupported older browsers are
  outside the currently verified environment.
- Completion requires reviewed visual changes and passing required CI checks before ordered merges.

Rollback is per-stage UI commits; no data rollback should be needed. Keep later independent scoring
and sync corrections when reverting presentation work.
