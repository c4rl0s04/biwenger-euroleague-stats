---
title: Task 25B UI ownership reconciliation plan
description: Reconcile the verified shell and ownership branches without restarting the UI migration.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 25B — UI ownership reconciliation

Planning baseline: main `1be12d61`, verified 25A branch `refactor/ownership-closure`
at `60dce378`, and shell branch `refactor/application-shell` at `620a4036`.
Both task worktrees were clean when inspected. This document authorizes no merge,
implementation, push or deployment; it records the next implementation scope.

## Objective and sequencing

Reconcile the existing shell/token work with 25A, retire genuinely unused adapters,
and give every retained UI compatibility module an owner, consumer list and removal gate.
Preserve the shell branch's approved appearance and behavior. Do not rebuild Task 23,
restart token foundations, or turn this into a feature-wide visual migration.

Task 23 is implemented and locally verified according to its branch receipt; the main
tracker's older “planned” label is not the current implementation state. Its published
checks still need verification for the exact candidate before integration. Historical
Linux/browser results are evidence, not acceptance of a future combined commit.

Recommended integration sequence, once authorized:

1. Pin the then-current 25A and shell heads and confirm both owners have finished editing.
2. Create a dedicated sibling `biwengerstats-next-ui-ownership-closure` worktree on
   `refactor/ui-ownership-closure` from the verified 25A head. Incorporate the approved
   shell head there, leaving main and both source worktrees intact.
3. Resolve overlapping changes and establish the combined baseline before 25B edits.
4. Implement the bounded closure below; verify the exact combined candidate.
5. Present that candidate for merge. Publishing or merging is a separate action from this plan.

25A can still be integrated separately after approval, but its green checks do not certify
its combination with the shell. Do not merge the UI branch solely because 25A passed.

## 1. Reconcile the two branches without restoring retired code

The inspected histories overlap in these paths:

- `docs/migration/tracker.md` and `docs/product/accounts-and-settings.md`.
- Assistant context service and its canonical context test.
- News boundary test.
- Retired Assistant compatibility test and Hoopgrid service adapter.

Overlapping paths are review targets, not confirmed merge conflicts. Keep the shell's
current interaction/composition changes while preserving 25A's direct feature imports,
explicit 100-round context limit, canonical calendar fields and removed adapters.
Never restore a deleted global service merely to resolve a conflict. Compare assertions
before resolving test deletions; preserve any distinct shell-branch coverage.

Regenerate the ownership inventory on the combined source, including root configuration,
service worker, operational scripts and workflow commands. Capture module/export callers,
CSS/custom-property users, test consumers, dynamic imports, and all unresolved references.
Static module imports alone cannot prove that CSS, tokens or PWA assets are unused.

## 2. Finish shell data ownership

`src/lib/services/app/appShellService.ts` remains the final global service module in 25A
and is still used by the new shell layout. Its responsibilities are known:

- `getAppStandings` is an alias of Standings' `getRequestStandings`.
- `getAppSeasonContext` uses React request caching around available seasons, selected
  season and active season; active-season failure falls back to the selected season.

Change the layout to consume `getRequestStandings` directly. Move the season-context
composition to an explicitly owned, server-only season infrastructure contract, preferably
`src/lib/seasons/server.ts`, keeping the existing `src/lib/seasons.ts` consumers compatible.
Expose an explicit serializable season-context type rather than database records.
This is shared season infrastructure, not a new business feature invented for a barrel.

Preserve request-local deduplication, selected-season precedence, available-season ordering,
null handling, active-season fallback and concurrent loading. Do not introduce persistent
caching, change cookie/session behavior or duplicate season queries. Retire the old shell
service only after layout, tests and all remaining callers use the new contracts.

Register the app layout in architecture enforcement. If the checker must recognize the
season infrastructure contract, recognize only that reviewed server entrypoint and test
its implementation boundary and client isolation. Do not exempt all of `src/lib`, all
shell components, or authentication transitive imports. Existing auth exceptions remain
a separate gate, not an opportunity for security changes in this slice.

## 3. Resolve UI barrels and Section ownership

| Area                                              | Planned disposition                                                                                                                      | Compatibility requirements                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/index.js`                         | Remove if consumer inventory confirms it is unused; otherwise replace callers with deliberate owner imports and then remove it           | Its `./standings` and `./player` exports are unresolved; do not recreate obsolete directories                                               |
| `src/components/layout/index.js` and `Section.js` | Replace the obsolete layout barrel with direct owner imports; move Section only after its shared-composition owner is agreed with UI-01C | Preserve generated/explicit IDs, accent normalization, registration/unregistration, DOM ordering, scroll offset, title markup and animation |
| Shell `SectionContext`                            | Keep shell ownership for sidebar navigation state                                                                                        | Shared content components should use a deliberate registration capability; avoid a generic primitive importing shell internals              |
| `MobileHeaderActions` → shell integrations        | Reconcile the documented temporary edge with UI-01C/UI-02                                                                                | Preserve Search/navigation/UserAvatar placement; extract a capability only when actual reuse justifies it                                   |
| Other UI barrels and unused helpers               | Remove proven-dead exports/modules; record live ones individually                                                                        | Check direct imports, barrel re-exports, tests, CSS and active UI branches before removal                                                   |

Do not silently move Section into `components/ui` merely because many screens use it:
it currently includes navigation registration and application-specific title styling.
If UI-01C has not settled its composition contract, leave that move explicitly pending
with its callers and owner. A documentation-only disposition is not architectural closure
of a live dependency.

## 4. Reconcile tokens and legacy theme consumers

Keep `src/styles/tokens/base-tokens.css` and `semantic-tokens.css` as the canonical token
sources. Preserve the existing Tailwind bridge, semantic shell roles and theme runtime.
Audit aliases by actual CSS/JS consumers, including light/dark/system behavior, hydration,
storage failures and cross-tab updates. Remove only aliases proven unused in the combined
candidate; do not change colors, naming semantics or existing visual references incidentally.

The shell receipt explicitly retains the legacy Card family, CardThemeContext, ThemeBackground
and some user/page compositions. CardThemeContext still has root/Card/background consumers;
ThemeSwitcher has no production importers but belongs to that coordinated compatibility family.
Inspect those relationships again before removal. Keep live feature-specific cards/screens
with their feature migration owner; no bulk Card replacement or shared universal-card API.

Inventory unused visual analytics/constants and mobile screen-state helpers from 25A.
For each retained item, record exact callers, why it remains, the owning UI milestone and
its deletion condition. Ensure there is no second token source or competing shell implementation.
Global safe-area, PWA clearance, reduced-motion and responsive layout rules may remain
shared infrastructure with a documented responsibility.

## 5. Strengthen boundary enforcement

Extend the existing shell boundary tests to cover:

- No shell/presentation database or global service imports; feature capabilities use
  deliberate public/server contracts and providers receive serializable data.
- No resurrection of deleted layout implementations or the 25A adapters.
- No generic primitive importing a business feature or shell implementation.
- No unresolved component barrel exports or new feature dependency cycle.
- Server-only season composition cannot enter a client bundle.

Classify root layout, login/install/offline, NextAuth and health entrypoints individually.
Protect applicable application adapters, documenting framework/protocol exclusions.
Re-audit exact exceptions; distinguish resolved edges, justified permanent infrastructure
and still-gated authentication debt. Do not claim completion by forcing exception counts to zero.

## 6. Validation and receipt

Establish the combined baseline before edits so shell changes and 25B regressions are
separable. Preserve original visual reference provenance; do not regenerate screenshots
to make an unexpected difference pass.

Run focused shell/navigation/Section/Search/theme/PWA tests, Standings request-cache and
season-context contracts, Assistant contracts affected by reconciliation, and checker
regressions. Add focused tests for any uncovered season fallback/deduplication and
Section registration lifecycle behavior. Use synthetic credentials and disposable data only.

Before merge, run `npm run verify` on the final combined candidate, including full tests,
lint, production build, schema metadata, Drizzle and diff checks. Then run the established
disposable browser matrix for shell/navigation, Search keyboard/selection, More-menu focus,
Settings/theme persistence, season switching, PWA/safe areas, and representative domain
screens using Section/Card. Include 25A's Lineup parity regression. Inspect the shell
receipt and available spec names before constructing the exact command list.

Use desktop and phone baselines, relevant tablet/landscape cases, and the established
Linux CI matrix for the exact published candidate when publication is authorized. Report
missing platform coverage explicitly. The known Market phone-bids issue needs its own
behavior decision; do not fix or mask it as ownership cleanup.

Produce a receipt containing pinned source/combined SHAs, resolved overlap decisions,
before/after inventory, removed files, retained-module caller table, exact exceptions,
commands/results, visual reference provenance and remaining gates. Update the tracker
from the verified source state, not historical “planned” labels.

## Completion boundary

The bounded 25B reconciliation is ready when the combined candidate passes its required
checks, the shell data adapter and dead barrels are retired, and retained UI infrastructure
has reviewed ownership with no unexplained duplicate implementation.

Full Task 25 remains open while live temporary Section/theme/capability adapters still need
UI-01C/UI-02 or feature adoption, or authentication exceptions lack their separate acceptance.
Do not label that debt resolved merely because its owner is documented. Full closure requires
retirement or explicit acceptance of a justified permanent boundary. Task 26 then provides
combined regression acceptance; Task 27 remains the separate release/deployment gate.
