---
title: Rounds and Standings integration
description: Combined migration preservation, acceptance and production release receipt.
audience:
  - maintainer
  - agent
status: active
---

# Rounds and Standings integration

## State

Application release INTEGRATED, PUSHED and DEPLOYED at `416ab25477bd12c5a948ede23ad168de1c76a3e2`.
Local acceptance passed. Remote build/test and formatting passed; browser CI was still running
when this receipt was written. The documentation-only follow-up preserves concurrent UI-plan
clarifications and records production verification; its final SHA is reported in the task handoff.
Primary main started at `713d2a3b`. Integration worktree:
`../biwengerstats-next-rounds-standings-integration`, branch `chore/rounds-standings-integration`.

## Preservation audit

- All six pre-existing worktrees inspected clean (including primary and the UI-plan checkout).
- Rounds `50e51639`, `5be73a8e`, prior Profile receipt `9d06ee0c`, and the complete
  Standings stack through `90334730` form a linear descendant of main.
- Preserved the six subsequent worker-playbook review commits through `4d52e5c5` with
  a conflict-free documentation merge, plus UI-layer plan `78e178c1` with a separate merge.
  No history rewrite, squash, cherry-pick or source conflict resolution.
- All domain architectural refactor branch tips are contained in the integration history.
  Historical sync/Season Review/PWA branches remain separate and preserved. Patch-equivalent
  commits on old branches do not imply lost work. Unmerged Season Review v5 product work
  and old sync ancestry are outside this read-domain release; no deletion is authorized.
- No new feature, UI redesign, dependency/schema change, production database operation,
  credential/fallback change or environment configuration is part of this integration.
- Preserved concurrent UI-plan clarification commits `643cee26` and `567c289c` through
  documentation merges. Their only conflicts were formatting: formatting the incoming document
  produced the same SHA-256 as our version. No content or application behavior was discarded.

## Review

Two independent read-only passes reviewed `713d2a3b...90334730`:

- Standards: no hard findings. Typed projections, server guards, deliberate contracts and
  compatibility adapters satisfy the documented boundaries.
- Spec: no concrete compatibility findings. SQL/formulas, ordering, cache bodies, HTTP logic,
  nullable/text-ID fields, draft bundle and original section projection behavior are preserved.

Sources retain
the intended flow: page/API adapter → feature service → query/repository → database,
with allowlisting mappers returning typed models to presentation. Legacy unmigrated domains
remain legacy; this release does not claim whole-repository completion.

## Local validation

- `npm run worktree:setup`: PASS on pinned Node 24.20.0; lockfile unchanged. Existing dependency
  deprecation/install-script notices were not suppressed or addressed through unrelated upgrades.
- `npm run verify`: PASS. Skills (6), architecture (794 modules / 44 entrypoints), documentation
  (82 notes), typecheck, 1,277 unit/contract tests with one existing skip, lint (0 errors / 25
  existing image warnings), database-disabled production build, schema metadata (38 tables),
  Drizzle consistency and diff checks all passed. Missing-provider build notices are expected.
- Focused Rounds/Standings features and HTTP tests: PASS, 342 tests / 39 files.
- Full source Prettier check matching CI: PASS. A dead historical desktop-component documentation
  link was corrected to the feature-owned path; no checker or exception was relaxed.
- Original Standings browser capture at `38bf2de4`: two desktop/iPhone cases PASS, followed by
  two repeat comparisons without snapshot updates PASS. All 11 images copied byte-identically
  into the integration candidate. Original application/fixture sources unchanged; its worktree
  restored clean, with generated evidence retained under ignored test artifacts.
- `npm run test:e2e:local`: PASS, all 90 cases across nine viewports (9.2 minutes), including
  the 11 unchanged Standings images and existing Rounds/Profile/Matches/Teams references.
  No candidate baseline updates, browser guard changes or application workarounds. The existing
  occasional destination-stream-close message occurred during local shell-test teardown;
  no browser/API error guard failed. The disposable application and database shut down normally.

## Pre-release production baseline

Production started READY at `713d2a3b`, deployment `dpl_9ASk8SVahwohAoQFdjDU9KCQPGHM`.
Fifteen safe probes recorded status/cache headers and JSON hashes without persisting response data.
Login/session returned 200; protected Rounds/Standings/Matches/Teams/Players routes redirected to
login. Public Standings/Rounds reads returned 200, invalid advanced type retained 400, anonymous
squad retained private/no-store 400. No sampled JSON credential/JWT/bearer/database-URL patterns
were found. The prior deployment's sampled error/fatal log counts were empty.

## Production verification

- Primary main fast-forwarded to the verified integration branch; normal push advanced
  `origin/main` from `713d2a3b` to `416ab254`. No force-push or rewritten history.
- Vercel deployment `dpl_BJh3Ur7sP3ZL6ppPo5BMhWE3gpG3` reached READY with that exact SHA.
  [Deployment](https://advanced-euroleague-biwenger-stats-qaw73js4o.vercel.app) was assigned the
  [production alias](https://advanced-euroleague-biwenger-stats.vercel.app).
- Fifteen post-release read-only probes returned the expected status codes, redirects and cache
  headers. Seven of eight JSON byte hashes matched directly. Draft statistics differed only
  because the mapper places `player_position` before `current_points`/`current_price` instead
  of after them. Reordering that object's keys to the original SQL projection order reproduced
  the exact baseline SHA-256 `738b6b992642af2702b429cfd0668c33dd0a96765bee182c9521c355169682e5`.
  No values, array order or field types were changed in this comparison.
- The first sequential probe attempt timed out; a bounded concurrent retry completed all probes.
  No 5xx response was observed. Sampled JSON and up to 100 runtime log entries contained no
  JWT/bearer/database-URL value patterns. Deployment-scoped error/fatal and 5xx log queries
  returned no entries in the first-hour window. These are bounded checks, not an all-time guarantee.
- The existing authenticated browser session loaded Standings and Rounds with real data and all
  expected section headings. Rounds rendering was inspected; no sampled browser console errors.
  No credentials were requested, inspected or persisted and no production mutations were submitted.
- CI run [34722100309](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions/runs/34722100309)
  passed Format Check and Test & Build; browser job completion remained pending at receipt time.

## Remaining scope

Next regular batch: Tournament analytics and screens, using existing core contracts, only after
this release is accepted and a pinned assignment is approved. Manager directory/other analytics,
Predictions, Playoffs, Schedule, public Market reads, Dashboard, Compare, Home/News, Season Review
and shell/adapters remain separate scopes. Private operations and credentials retain their
security gates. Linux Standings/Rounds/Profile visual reference capture and exhaustive physical-phone
production visual review remain manual follow-ups; Linux semantic tests stay enabled.
