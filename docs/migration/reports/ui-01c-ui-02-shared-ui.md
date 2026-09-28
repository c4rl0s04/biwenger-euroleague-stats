---
title: UI-01C and UI-02 bounded shared UI
description: Demand-driven empty-result composition and shared modal interactions without feature migration.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# UI-01C / UI-02 — bounded shared UI

Created from PR #49 integration `9cfb84e51a0b3c46f70fdc47ed8f9a98a8bdce2b`.
Reconciled onto main `c0c91dd4f86b3fdeb0378551edca931ec2212cda` after PR #50 merged.
The tracker combined cleanly; all upstream ownership cleanup is preserved unchanged.
A fresh docs check exposed five upstream links to the deleted global service directory;
the architecture/product notes now point to the existing feature owners. Two Market contract tests
still mocked the removed layout barrel; their mocks now target the existing Section default export,
without changing assertions. No domain implementation was changed.
Branch: `feat/ui-shared-compositions-controls`.
Integrated via PR #51 at `7f4df6e9`. No feature page, route, domain, auth, DB or dependency changes.

## Reuse audit and delivery

- **UI-01C: EmptyState.** GlobalSearch and CommandPalette duplicated neutral centered empty-result copy.
  The shared composition owns semantic muted text and alignment; owners retain copy, query conditions
  and spacing. It adds no unnecessary Card or Surface, live region or domain model. Existing Button
  and other primitives can be composed as children when a future caller actually needs an action.
- **UI-02: ModalDialog.** MobileBottomSheet, MobileMoreMenu and CommandPalette duplicated initial focus, Tab wrapping,
  Escape, scroll locking and restoration. The shared mounted interaction boundary preserves their
  div/section markup, accessible naming, close controls, backdrop/portal ownership and layout classes.
  It excludes unavailable tab stops, contains focus escape, tolerates changing close callbacks without
  restarting focus, and keeps nested dialog scroll locks until the last dialog closes. No animation
  is introduced; existing safe-area, layer and reduced-motion CSS stays with each owner.

CommandPalette now shares the boundary because its global shortcut can open above a sheet;
cmdk still owns search/selection, and its existing outer element and layout remain intact.

Both exports use `@/components/ui/foundation`; EmptyState supports SSR without a client boundary,
while ModalDialog owns browser effects in a client boundary. Neither imports shell, features, theme
context, domain data or server code. ModalDialog does not position/populate a dialog or provide a
universal responsive overlay template.

PageHeader/Subheading and mobile headings have different hierarchy/layout obligations; entity
identity carries domain metadata; neither warrants a parallel abstraction in this bounded change.
SeasonSelector, AccountMenu, GlobalSearch, cmdk CommandPalette, CustomSelect, Dropdown, Tooltip,
Drawer and MobileSegmentedControl were inspected: selection, navigation, search and modal semantics
are different, so their interaction contracts are retained rather than unified into a speculative API.
Legacy feature empty states (Teams, Standings, Rounds, Market) remain migration evidence, not adopters.

## Compatibility

No legacy component is deleted. ThemeBackground, CardThemeContext, legacy Card variants, Section,
PageHeader, Subheading, Drawer, selects and mobile wrappers still have legitimate consumers.
MobileHeaderActions' temporary shell-capability edge remains as documented in Task 23; this change
shares generic dialog behavior, not application search/navigation ownership.

MobileHeaderActions supplies explicit search/profile trigger refs for restoration: a real WebKit
probe confirmed that clicking a phone button leaves `document.activeElement` at `body`. Inferring
the opener from activeElement alone therefore cannot restore focus on touch/WebKit. No action,
authentication behavior or visual styling changed.

## Verification

Baseline: 99 focused tests passed before edits. New tests cover EmptyState SSR/content/composition,
ModalDialog SSR/naming, and real dark/light search and modal interactions on desktop/phone.
The browser tests exercise both real sheet consumers, portal placement, initial focus, both Tab
boundaries, unavailable controls, focus escape, Escape/backdrop dismissal, nested scroll locks and
focus restoration. Existing screenshots and error guards remain unchanged.

Final local verification on the reconciled implementation passed:

| Command                                                                    | Result                                                           |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `npm run skills:check`                                                     | PASS; 6 skills                                                   |
| `npm run architecture:check`                                               | PASS; 1,063 modules, 124 protected entrypoints                   |
| `npm run docs:check`                                                       | PASS; 131 notes                                                  |
| `npm run typecheck`                                                        | PASS                                                             |
| `npm run lint`                                                             | PASS; zero errors, 24 existing warnings                          |
| `npm run test:run -- --maxWorkers=2`                                       | PASS; 2,873 tests, 8 existing skips; 350 files passed, 4 skipped |
| `npm run db:audit:schema:metadata`                                         | PASS; 37 matching tables, no differences                         |
| `npx --no-install drizzle-kit check`                                       | PASS                                                             |
| `SKIP_DB=true npm run build`                                               | PASS; 52 static pages                                            |
| `npx --no-install prettier --check "src/**/*.{js,jsx,ts,tsx,json,css,md}"` | PASS                                                             |
| `git diff --check`                                                         | PASS                                                             |
| `npm run verify`                                                           | PASS; all sequential gates above                                 |

`npm run test:e2e:local -- --project=iphone-13 --project=desktop-1440 tests/e2e/shared-ui.spec.ts tests/e2e/pwa-responsive.spec.ts tests/e2e/feature-screens.spec.ts`:
**12 passed**, no skips, 52.8 seconds on the reconciled base. This includes four new dark/light
interaction cases, existing PWA/shell contracts, and all four existing Matches/Team screenshots for
these two projects. No snapshots, tolerances or browser/API error guards changed. The runner also
passed its disposable PostgreSQL integrity checks. No production database was used.

The local verify/browser invocations used `RAYON_NUM_THREADS=2` to bound build concurrency on the
shared machine. No repository build configuration changed. Missing provider configuration warnings
are expected in the isolated build. Earlier interrupted runs and the two upstream verification
failures were superseded by these successful final runs. Remote CI is reported on the new PR.

## Next

This completes only the demonstrated EmptyState and ModalDialog scope, not a full component library.
The bounded UI-01C/UI-02 work is integrated through PR #51 at `7f4df6e9`. UI-03 Season Predictions
pilot remains next and unimplemented. UI-04 and feature migrations follow separately.
