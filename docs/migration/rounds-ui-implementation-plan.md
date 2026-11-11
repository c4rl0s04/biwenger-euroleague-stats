---
title: Rounds UI foundation implementation plan
description: Preserve rounds-specific cards and behavior while migrating their presentation to the shared UI foundation.
audience:
  - contributor
  - maintainer
  - agent
status: draft
---

# Rounds UI foundation implementation plan

## 1. Objective and scope

Preserve the recognizable rounds experience: a large round selector panel, compact standings,
score summary, basketball court and bench, player leader cards, performance history, records,
and league comparisons. Rebuild their presentation on the shared foundation, improving hierarchy,
readability, theme consistency and accessible interaction without changing sporting behavior.

This is an implementation plan, not an implementation or release receipt. The user approved this
migration direction on 23 October 2026. The individual visual changes below remain reviewable in
implementation PRs. Do not turn this document into an instruction to start unrelated migrations.

Source audit: main at `e0a28e19`, including the selector work from PR #117. PR #119 contains the
missing-score slash behavior and is a prerequisite: confirm it is integrated before implementation,
or explicitly preserve its changes when selecting the implementation base. Do not silently omit it.

References:

- [Design context](../product/design-system.md) and [UI design direction](../product/ui-design-direction.md).
- [UI foundation](../architecture/ui-foundation-v1.md) and [application layers](../architecture/application-layers.md).
- [Rounds feature](../../src/features/rounds) and [foundation exports](../../src/components/ui/foundation.ts).
- [Season Predictions composition](../../src/features/season-predictions/components/SeasonPredictionsScreen.tsx).
- [Testing workflow](../contributing/testing.md) and [agent workflow](../contributing/agent-workflow.md).

### In scope

- Desktop `/rounds`, including all four analytical sections and their rendered descendants.
- Phone `/rounds` and `/rounds/[roundId]/[section]`: preserve the dedicated composition and links;
  align changed shared styles and states without copying the desktop grid.
- Foundation composition, typography, surfaces, identity presentation, controls, loading/empty/error
  states, tooltips, dark/light appearance and keyboard behavior.
- Small, demonstrated reusable additions needed by this screen, with explicit ownership below.

### Out of scope

- Queries, scoring algorithms, captain/bench multipliers, formation rules, standings calculations,
  historic squad reconstruction, synchronization, authentication, caching and API envelope changes.
- Provider operations, production data repair, schema changes, dependency upgrades and chart-library replacement.
- Global replacement of legacy UI across other pages, bulk JavaScript conversion or a new navigation model.
- Reintroducing dormant components or exposing additional analytics not currently shown.

If presentation requires information absent from a view model, record that gap and assess it separately;
do not mix a data-contract redesign into the UI migration.

## 2. Compatibility and visual contract

Keep these behaviors throughout all stages:

1. Existing URLs, `roundId` query behavior, default-round selection and previous/next round semantics.
2. Manager selection, standings sorting, comparison membership and metric toggles.
3. Quick/full loading coordination, stale-response protection, retry and valid-lineup preservation.
4. One global ideal per round, independent of the selected manager; personal ideal remains manager-specific.
5. Actual lineup orange, personal ideal green, global ideal purple, with labels and selected states as well as color.
6. Official EuroLeague player/team artwork; user-configured manager avatars; missing-image fallbacks.
7. Missing player score `/`, recorded zero `0`, negative/positive scores and valid reconstructed historical scores.
8. Upcoming/live/finished distinctions, provisional totals, unavailable lineups and pre-season state.
9. Compact standings rows whose height does not stretch to match the court or bench.
10. Current section anchors, sidebar entries and player/manager navigation destinations.

Keep section order, the desktop standings/court split, the separate bench, four player leaders,
personal metric group and the comparison grouping. Keep the court geometry and captain/position cues.

Improve card anatomy, heading levels, spacing, numeric alignment, long-name handling and focus states.
Replace hard-coded dark surfaces/text with semantic tokens. Keep meaningful domain accents; reduce
repeated decorative glow and automatic card scaling. Do not remove the large selector panel or
make its selected label oversized again. A foundation migration is not pixel-identical: heading,
surface and spacing changes must be explicit in the visual review.

## 3. Target composition and ownership

The page header uses foundation `PageHeader` within `PageCanvas`. Each full-width analytical band
uses `PageSection` with `SectionHeader`; nested groups use `SectionHeader level={3}`. Avoid wrapping
all bands inside a second padded container. Use one page `h1`, section `h2`, nested `h3` and card
headings at the appropriate level through `CardTitle as`.

Legacy [Section](../../src/components/layout/Section.js) owns both visuals and sidebar registration.
Foundation `PageSection` only owns presentation. Introduce a rounds-owned section composition that
uses `PageSection`/`SectionHeader` and the existing section context to register/unregister entries.
Preserve existing IDs and ordering, including conditional sections. Do not modify every legacy
Section consumer. Extract registration into shared infrastructure only if a second real consumer
needs the same contract. Test unmounting and conditional section visibility.

Feature cards remain under `src/features/rounds/components`. Reuse foundation `Card`, `CardHeader`,
`CardTitle`, `CardDescription` and `CardContent`; keep basketball-specific markup and behavior local.
New substantial component boundaries should use TypeScript/TSX; leave untouched JavaScript alone.
Continue using existing client-safe view models and feature entrypoints. Do not move persistence
or data fetching into presentation components.

## 4. Component implementation inventory

| Current area                                            | Target work                                                                                              | Preserve and verify                                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `RoundsScreen`, legacy page header                      | Foundation page header/canvas                                                                            | Title, description, one h1, aligned gutters                                    |
| Four legacy `Section` bands                             | Foundation sections plus explicit registration                                                           | IDs, sidebar navigation, order, alternating surfaces                           |
| Personal-statistics `Subheading`                        | Nested section header                                                                                    | Manager name, wrapping, correct heading hierarchy                              |
| `RoundControls` and selector panel                      | Foundation card and compact shared select; foundation navigation controls styled to retain larger arrows | Large centered panel, compact menu, disabled boundaries, Escape and focus      |
| `RoundStandings`                                        | Finish existing foundation adoption; use Avatar and domain tokens                                        | Sorting, selected manager, equal compact rows, independent height              |
| `ScoreOverviewCard`                                     | Foundation surface with prominent metric and secondary breakdown                                         | Actual/ideal mode colors, provisional state, rank, missing total, zero         |
| `BasketballCourt`, `PlayerCourtCard`, `Bench`           | Foundation bench shell; theme-aware labels and surrounding UI                                            | Court geometry, five starters, captain/position cues, player links, slash/zero |
| `GradaCard`, `GradaList`                                | Foundation card and identity rows                                                                        | Conditional visibility, existing ordering and player navigation                |
| `OptimizationTips`                                      | Theme-aware inline advice composition                                                                    | Existing captain-opportunity condition and message content                     |
| `StatLeaderCard` x4                                     | Keep feature-specific portrait/metric layout on foundation surfaces                                      | Leader categories, units, image fallback, null state, player navigation        |
| History comparison toolbar                              | Foundation buttons, avatars and keyboard-operable comparison picker                                      | Independent actual/ideal toggles, selected users, minimum-one-user behavior    |
| `PerformanceChart`                                      | Foundation frame and theme-aware axes, legend and tooltip                                                | Recharts, series values, user colors, missing data, chart height               |
| `RecordsGrid`                                           | Foundation cards with existing competition ranking content                                               | All six record categories, ordering, values, round labels                      |
| `HistoryStatCard` x4                                    | Rounds metric composition; explicit tone mapping                                                         | Efficiency, lost points, best round, best efficiency, units and missing values |
| `PersonalBreakdownTable`                                | Foundation frame, themed table cells, IconButton scroll controls                                         | Metric rows, round columns, sticky labels, overflow and navigation             |
| `LeagueLeaderboard`                                     | Foundation wrapper and theme-aware sortable table                                                        | Sort keys/directions, manager links, identity and numeric columns              |
| `EfficiencyHeatmap`                                     | Foundation wrapper and semantic cell/text/tooltip styling                                                | Round/user matrix, thresholds, legend and missing-cell treatment               |
| `ConsistencyRanking`                                    | Foundation wrapper and themed ranking/distribution rows                                                  | Existing calculation, scale, labels and ordering                               |
| `PerfectRoundsCard`                                     | Foundation wrapper and keyboard/touch-readable segment details                                           | Threshold categories, totals, legend and distributions                         |
| `LineupStatsCard`                                       | Foundation wrapper and consistent manager/formation presentation                                         | Global/user formation frequencies, labels and existing layout                  |
| `MobileRoundsScreen`, `RoundSectionScreen`, `RoundRows` | Preserve phone composition; align affected theme/heading/state presentation                              | Overview and four detail links, metric parity, selected round, slash/zero      |

Only rendered components count toward this migration. `CoachRatingCard` is commented out in the
sidebar; do not activate it. Confirm actual consumers before changing `RoundMVPCard` or deleting
anything that appears obsolete. `StatsList` is a shared competition-domain component: consume its
contract without silently redesigning all other consumers.

## 5. Reusable component decisions

### Compact select: shared foundation control

Evolve the existing `CustomSelect` behavior into a foundation control rather than inventing another
round-specific dropdown. Implement a typed single-selection contract with explicit option IDs,
labels, selected/disabled states, compact sizing and optional supporting content where used.

The rounds caller needs a compact trigger and menu. Preserve original round-ID types at the feature
adapter. Cover keyboard opening, Arrow/Home/End navigation, selection, Escape, focus restoration,
outside dismissal, long labels, scrolling and menu visibility above cards/scroll containers.
Use semantic theme tokens for trigger, menu, selection and focus. Do not force the modal
`SearchableSelect` interaction onto this compact selector.

Keep a legacy adapter/defaults for existing CustomSelect callers if necessary. Adopt the foundation
control on rounds only in this migration. Add compatibility checks for a representative default
caller; do not silently shrink or restyle menus on Players, Market or Hoopgrid. Avoid two permanent
implementations of the same compact control.

### Metric presentation: rounds-owned initially

Use a small rounds composition for label, value, unit, supporting text and optional icon/trend.
Adopt it in the four personal metrics, reusing relevant pieces in the score summary only where the
anatomy truly matches. Keep the score summary's focal layout distinct. Use explicit semantic/domain
tone mappings instead of runtime Tailwind strings such as `text-${color}-400`.

Promote this to shared UI only after another real feature needs the same presentation and states.
Do not introduce a universal configurable statistics-card engine.

### Chart frame, tooltip and comparison picker

Use existing Card anatomy for chart title/actions and existing EmptyState/Skeleton primitives.
A named shared ChartFrame is optional: create it only when at least two real chart consumers share
that structure. Keep Recharts series and sporting calculations outside shared UI.

Inspect existing Tooltip/Dropdown controls before adding overlay infrastructure. Prefer one
accessible positioning/focus behavior with feature-owned content. Heatmap/distribution details
must be available to keyboard and touch, not only CSS hover. The comparison picker is multi-select;
keep its feature ownership unless a real reusable multi-select contract emerges. Do not misuse
the single-selection SearchableSelect or create a second modal focus trap.

### Tables and ranking content

Use native semantic tables and existing ranking/domain contracts. A small table-scroll shell may
be justified by the two tables; a generic DataTable/sorting framework is not required. Do not add
new dependencies or duplicate manager identity logic merely to unify appearance.

## 6. Delivery sequence

### Preparation: baseline and prerequisites

- Confirm PR #119 is integrated and select the current main base; preserve unrelated worktrees.
- Use a dedicated sibling worktree and conventional task branch for each implementation stage.
- Record existing focused unit/browser results and pre-existing warnings.
- Capture representative current dark/light desktop and phone states using disposable fixtures.
- Add deterministic fixtures where current data does not exercise records, tooltips, long names,
  negative points, missing scores and multi-user comparison. Never rely on changing production data.
- Record explicit visual allowances: foundation headings/surfaces, improved contrast, reduced
  decoration and normalized control sizing. The information grouping remains stable.

### Stage 1: page frame, headings and section navigation

Deliver foundation page/section composition, correct heading hierarchy, sidebar registration and
phone compatibility. Keep card internals unchanged for this stage.

Acceptance: every section link scrolls to its existing target; conditional sections register and
unregister correctly; no double gutters, missing page title or duplicate h1; long personal headings
wrap; desktop and phone navigation/selected round behave as before. Review dark/light screenshots.

Open a draft PR with focused evidence; CI must pass before merge. Stage 2 builds on the integrated
stage or an explicitly documented stacked base, not an accidental mixture of unrelated changes.

### Stage 2: round workspace and reusable control

Deliver compact foundation select and compatibility adapter, selector panel, standings finish,
score summary, bench shell, Grada/advice and four leader cards. Keep the existing independent
standings/court sizing. Add the rounds metric composition and migrate the personal metric cards.

Acceptance: selector design remains recognizable; keyboard and boundary cases pass; changing
manager never changes the global ideal; adding/removing bench players does not stretch standings;
portrait fallbacks and score slash/zero remain correct; mode colors are distinct in both themes.
No newly introduced global component owns basketball behavior.

### Stage 3: history, charts, tables and comparisons

Deliver comparison controls, chart frame/tooltips, six record cards, breakdown table, league
leaderboard, heatmap, consistency/perfect-round distributions and preferred formations. Finish
phone theme/state alignment for anything affected; preserve the existing phone route structure.

Acceptance: toggles and comparison membership retain their behavior; chart/table values and ordering
match the baseline; sticky columns and overflow work at narrow desktop widths; heatmap/distribution
information is accessible without hover; every visible legacy card shell in rounds has migrated.
Update visual references only for reviewed differences. Complete a legacy-import audit before handoff.

## 7. Verification matrix and commands

| Dimension   | Required cases                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Round state | Pre-season, upcoming, live, finished; change rounds during an in-flight request                   |
| Data state  | Loading, empty, retryable error, incomplete full response, missing lineup, missing image          |
| Score state | Null/missing `/`, real zero, negative, positive, calculated historical score; actual and ideals   |
| Identity    | Selected manager, long names, absent avatar, official player artwork, manager comparisons         |
| Layout      | Empty bench, populated bench, six managers, horizontal table overflow, sticky labels              |
| Theme/input | Dark/light, keyboard-only controls, focus return, touch detail access, reduced motion             |
| Viewport    | Desktop 1280 and 1440; boundary around the existing xl split; iPhone 13 plus a narrow phone check |
| Navigation  | Section sidebar anchors, player/manager links, overview and phone detail routes                   |

Use meaningful tests at the layer changed: section registration lifecycle, compact-control behavior,
metric missing/zero formatting and chart/table presentation contracts. Do not rewrite scoring tests
around a UI refactor. Retain the existing stale-response and manager-switch browser checks.

Focused commands, from the implementation worktree with pinned Node 24.20.0:

```bash
npm run test:run -- --maxWorkers=2 src/features/rounds
npm run architecture:check
npm run db:audit:schema:metadata
npx --no-install drizzle-kit check
npm run test:e2e:local -- rounds-live.spec.ts rounds.spec.ts --project=desktop-1280 --project=desktop-1440 --project=iphone-13
git diff --check
```

Add focused unit suites for any changed shared control and its compatibility adapter. Run ESLint
and Prettier on touched files. The local browser runner requires PostgreSQL tooling, uses a disposable
database and includes build/typecheck; follow the linked testing guide for its environment. Extend
the focused browser cases where needed; do not assume existing rounds screenshots cover every card.
Review initial/changed captures before accepting snapshots, then run comparisons without updates.

CI owns the full lint/unit/browser validation. Do not run the entire verify suite locally by default,
or poll CI after opening a PR. Record each executed command/result and any skipped or failed check.
Do not claim full validation while CI is pending. Production deployment and merge remain separate
user-authorized actions, and required checks must pass before merge.

## 8. Completion checklist and rollback

- [ ] All three implementation stages and prerequisites integrated, with reviewed evidence.
- [ ] Every rendered rounds card uses foundation surfaces/anatomy or a justified foundation-based feature composition.
- [ ] No rounds imports of legacy PageHeader/Subheading/Section/ElegantCard remain in migrated rendering paths.
- [ ] Shared legacy components still needed by other features remain supported.
- [ ] No scoring, provider, cache, API, synchronization or URL changes introduced.
- [ ] Section anchors, comparison controls, sorting and phone routes verified.
- [ ] Official media, slash/zero semantics and actual/personal/global colors preserved.
- [ ] Dark/light and keyboard/touch states reviewed; no new overflow or stretched standings.
- [ ] New reusable controls have focused tests and compatibility evidence.
- [ ] CI passes before merge; PR descriptions identify visual changes, limits and exact tested states.

Rollback is per-stage: revert the relevant UI commit/PR while keeping subsequent independent scoring
or sync fixes. No data migration or provider rollback should be necessary. Do not remove feature
cards or permanently change shared legacy defaults as a shortcut to finish the migration.
