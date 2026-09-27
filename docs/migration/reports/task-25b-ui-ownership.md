---
title: Task 25B UI ownership reconciliation
description: Combined shell and ownership candidate, retained UI boundaries and deferred CI acceptance.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 25B — UI ownership reconciliation

Implemented on `refactor/ui-ownership-closure` in the sibling
`biwengerstats-next-ui-ownership-closure` worktree. The combined baseline merges
25A `460f3d35` and shell `620a4036` at `81147e9a`. Main is unchanged.
The [approved plan](../task-25b-plan.md) defines this bounded reconciliation.

## Changes

- The app layout calls Standings' existing request service directly. The final global
  `appShellService` is removed.
- Season selection composition lives in `src/lib/seasons/server.ts`: server-only,
  React request-cached and explicitly typed. The allowlisted season view model converts
  `frozenAt` to ISO text. Ordering, selected and active IDs, active-season fallback,
  error propagation and parallel reads remain unchanged. No persistent cache is added.
- Unused root component and layout barrels are removed. Section consumers import the
  existing component directly; its appearance and shell registration are preserved.
- Architecture checks protect shell/UI boundaries and the narrow season contract.
  Root, authenticated-app, login, install and offline adapters join coverage, raising
  protected entrypoints from 119 to 124 without adding authentication exceptions.
- Regression tests cover season serialization/fallback/errors, direct layout contracts,
  deleted barrels, server leaks and primitive ownership. These tests await CI execution.

Merge resolution retained 25A's deleted legacy Assistant test and Hoopgrid service:
changes on the shell branch were formatting only. Accounts documentation preserves both
shell screen links and the Accounts/Managers service contracts. Canonical Assistant and
News changes remain intact.

## Retained ownership and tokens

The reproducible [UI inventory](task-25b-ui-inventory.json) is generated with
`node scripts/architecture/ui-ownership-audit.mjs`. It records runtime callers for
Section, legacy Card and all five dispatch variants, theme compatibility, mobile
capabilities and retained utilities, plus 164 CSS custom-property definitions/references.
No token values or visual compositions change. Static references do not prove that a
Tailwind token or dynamically dispatched component is unused.

Section remains at its existing path pending the UI-01C composition contract; its
shell context dependency is explicit. MobileHeaderActions/UserAvatar remain owned by
UI-01C/UI-02 adoption. Card variants, CardThemeContext and ThemeBackground remain live
compatibility boundaries; ThemeSwitcher is retained with no current runtime callers
pending the same adoption decision. The analytics, threshold and mobile-state utilities
are inventoried, not silently removed based solely on zero runtime callers.

The general inventory reports 1,112 modules with no unresolved local runtime imports.
The architecture graph covers 1,061 source modules. The existing 216 exact authentication
and credential persistence exceptions remain separately gated; NextAuth protocol and
health exclusions are unchanged. Full Task 25 remains open for these gates and live UI
compatibility adoption.

## Validation and release limits

The user explicitly requested fast implementation and deferred full local validation to
CI. The combined baseline was reviewed structurally; no combined full-test baseline was
run. Historical 25A and shell receipts are not verification of this candidate.

Quick validation: `SKIP_DB=true npm run typecheck`, `npm run architecture:check`,
`npm run docs:check`, and `git diff --check`. All four checks passed after correcting a stale Assistant service documentation link.
The UI and general ownership inventory commands completed successfully.

Full unit suites, production build, schema consistency checks, full lint and browser/
visual acceptance were not run locally. New tests await CI; no claim of visual or full
regression acceptance is made. No schema, production data, provider, credentials or
deployment configuration changed. The existing CI runs on pull requests to main/master
and pushes to main/master; a local commit alone does not start it. This candidate has
not been merged into main or pushed.
