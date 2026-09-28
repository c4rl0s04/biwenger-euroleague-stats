---
title: Settings theme preference
description: Bounded production Settings control for the existing application theme preference.
audience:
  - contributor
  - maintainer
status: active
---

# Settings theme preference

Base: latest fetched `origin/main`, `7f4df6e9`, on 2026-09-27, including merged PR #51.
Branch: `feat/theme-preference-settings`.
Integrated via PR #56 at `47f1afd9`; follow-up documentation repair PR #57 is integrated at `a7d2523b`.

Accounts owns `ThemePreferenceControl.tsx`; desktop Settings adds a bounded Appearance section,
and mobile Appearance replaces the fixed dark-theme row. Native radios select `theme` and call
`setTheme`; `resolvedTheme` is descriptive only. Surface and semantic tokens provide both palettes.

Snow remains independent. No theme persistence, bootstrap, hydration, default, provider, chrome,
authentication, database or provider behavior changes. Legacy settings forms and Card themes remain.
Light/system are explicit user preferences; legacy feature-page migration remains incremental.
UI-01C and UI-02 were already integrated via PR #51 before this control. UI-03 Season Predictions is
the next UI milestone and remains unstarted.

## Verification

Validation uses pinned Node 24.20.0 and the task worktree. The standard commands below run through
`npm run verify`, whose child processes use `SKIP_DB=true`.

| Command                                                                    | Result                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm run skills:check`                                                     | Passed                                                                   |
| `npm run architecture:check`                                               | Passed: 1066 modules, 125 protected entrypoints                          |
| `npm run docs:check`                                                       | Passed                                                                   |
| `npm run typecheck`                                                        | Passed                                                                   |
| `npm run test:run -- --maxWorkers=2`                                       | Passed: 2888 tests; 4 suites / 8 tests skipped by existing configuration |
| `npm run lint`                                                             | Passed: 0 errors, 24 warnings in existing code                           |
| `SKIP_DB=true npm run build`                                               | Passed                                                                   |
| `npm run db:audit:schema:metadata`                                         | Passed                                                                   |
| `npx --no-install drizzle-kit check`                                       | Passed                                                                   |
| `npx --no-install prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}"` | Passed                                                                   |
| `git diff --check`                                                         | Passed                                                                   |
| `npm run verify`                                                           | Passed                                                                   |

The build emitted only expected missing Biwenger configuration warnings in the database-disabled
environment. Both schema checks ran offline; all 37 tables matched their migration metadata.

Focused unit tests for the control and unchanged theme infrastructure passed: 24 tests.
The control tests cover each stored selection, all three setter values, and system resolution
without changing selection semantics.

## Browser verification

The existing `application-theme.spec.ts` suite passed all 16 cases across `iphone-13` and
`desktop-1440` in the combined theme/Settings run. That run exposed missing WebKit focus styling
in the new Settings case. The control now uses an explicit solid `focus-within` outline. The
keyboard test exercises both arrow directions without assuming native WebKit wraps at the end
of a radio group. Existing theme tests and visual baselines are unchanged.

Final focused command:

`npm run test:e2e:local -- --project=iphone-13 --project=desktop-1440 tests/e2e/theme-preference-settings.spec.ts`

Result: **2 passed**, using the disposable PostgreSQL fixture and real login. Coverage includes:

- the missing-preference dark baseline even with a light OS;
- Light / Dark / System selection, immediate root theme changes and persistence after reload;
- System following emulated OS changes while retaining stored `system` and the selected radio;
- native keyboard selection, visible focus and targets at least 44px;
- independent Snow state, including toggling Snow without changing the selected theme;
- navigation away/back, readable phone Settings/Appearance titles, and no horizontal overflow;
- unchanged guards against hydration errors, browser exceptions and failed application APIs.

Desktop `/settings` (1440×900) and phone `/settings → /settings/appearance` (390×664) dark/light
captures were inspected.
The phone heading color correction is scoped to these Settings surfaces; shared scaffolds and
other feature headings are unchanged. Account forms, PageHeader, Section and legacy feature colors
remain incremental migration work, not a claim of complete light-mode readiness.
