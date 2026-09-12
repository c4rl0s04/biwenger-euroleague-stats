---
title: UI component layering target
description: Agreed UI composition and reuse direction for the pass after domain architecture migration.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# UI component layering target

## Status and scope

This records the agreed future UI structure, not a claim that it is already implemented.
The domain architecture migration comes first. A subsequent UI consolidation pass will inventory
existing components, extract useful reusable patterns and adopt these layers incrementally.
This note does not authorize starting that pass, redesigning screens or changing current migration scope.

The [application layers](application-layers.md) govern data ownership and feature boundaries.
The [design context](../product/design-system.md) remains the authority for current styling.

## Layers, from foundations to complete screens

| Layer                              | Responsibility                                                                    | Examples and ownership                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Base tokens                        | Raw design values                                                                 | Color palettes, spacing scales, font sizes, radii and shadows                                                       |
| Semantic tokens                    | Assign visual meaning to base values                                              | Background, surface, muted text, border, accent; build on existing global CSS tokens and Tailwind mapping           |
| UI primitives                      | Small domain-independent visual elements                                          | Button, badge, input, card frame, skeleton; shared UI                                                               |
| Reusable controls and compositions | Combine primitives without domain rules                                           | SearchableSelect, metric display, card header, chart frame, empty-state panel; share when actual reuse justifies it |
| Reusable domain components         | Domain-specific presentation and interactions usable in several cards or features | ManagerSelector, PlayerSelector, MatchRow, StandingsTable; owning domain feature                                    |
| Feature cards and panels           | Assemble controls and data displays for a particular use case                     | ManagerPerformanceCard, PlayerStatisticsCard; owning feature                                                        |
| Feature sections                   | Group related feature components into a meaningful screen region                  | RankingSection, PerformanceSection; owning feature, optionally using the shared Section container                   |
| Screens                            | Arrange imported sections and components for desktop/mobile                       | StandingsScreen; owning feature                                                                                     |
| Pages                              | Adapt framework inputs and render the feature screen                              | Next.js page files; no embedded domain presentation implementation                                                  |

The existing shared Section or Card template is a visual container, not the implementation of
every domain section or card. A RankingSection can live in its own file, use Section internally,
and compose StandingsTable and other relevant feature components.

These are logical responsibilities, not a requirement for one folder, stylesheet or wrapper per
layer. Base and semantic tokens may coexist in the existing stylesheet. A component can use the
layers it needs directly; do not add intermediate components merely to complete the hierarchy.

## Composition rules

- A page renders the screen as its domain UI. It may still await route inputs, run the appropriate
  access/route guard, call a feature service and pass its typed model to the screen. It must not
  fetch through an internal HTTP endpoint when a direct server service call is appropriate.
- A screen imports and arranges sections/components, passing their relevant data. It does not
  define their component implementations inside the screen file. Small layout wrappers and
  conditional composition are appropriate; substantial domain markup belongs in separate files.
- A feature section imports its child components. Extract a section when it has a meaningful
  responsibility, sufficient complexity or reuse. A trivial Section wrapper can remain in the
  screen; every layer need not appear in every screen.
- Each meaningful new feature component has its own file in the owning feature. Reuse shared
  primitives and compositions internally instead of copying styling or markup between pages.
- Services/queries/mappers prepare domain data; hooks can encapsulate reusable browser interaction
  logic. Screens and presentational components receive explicit view models, not database records.
  Screen-level coordination state is allowed when it genuinely coordinates its children.
- Keep client-safe exports in public.ts and server-only services in server.ts. Do not move a
  screen to the client merely to compose it or introduce cross-feature deep imports.

An illustrative composition (names are examples, not assertions about existing files):

```text
StandingsPage                  route inputs/guard -> service -> screen
└── StandingsScreen            layout and data passing
    ├── PageHeader             shared composition
    ├── RankingSection         feature-owned section
    │   └── StandingsTable     feature-owned component
    └── PerformanceSection     feature-owned section
        └── PerformanceChart   feature-owned component
```

RankingSection and PerformanceSection may each use the existing shared Section container.
Tables/charts may use shared visual primitives without sharing their domain calculations.

## Reuse and styling decisions

Keep one coherent token system; do not introduce a competing theme or hard-code repeated visual
values in individual screens. Preserve semantic team, manager and statistic colors, which are not
interchangeable with brand colors. Existing token locations are the starting point, not a mandate
to create a new directory or token file for every category.

Share components because their responsibilities and behavior genuinely match, not solely because
they look similar. Prefer explicit variants and composition to a universal component with many
unrelated switches. Domain-specific components stay feature-owned even when another feature consumes
them through a deliberate public contract. Avoid speculative abstractions and one-file-per-HTML-tag rules.

## Reusable controls inside different cards

Reuse applies to the elements inside cards, not only their outer containers. Two cards displaying
different statistics may share a manager selector, avatar/name display, metric label or filter control.
Do not duplicate their selection, search, keyboard or focus behavior inside each card.

Distinguish composition (which component renders which) from ownership (which module maintains it).
A component's separate file does not automatically make it globally owned. Reuse across several pages
is not evidence that a component is domain-independent; feature folders represent domains, not pages.

Illustrative target ownership, to be confirmed against existing components during the future inventory:

```text
src/components/ui/
  SearchableSelect.tsx             generic options, search and selection behavior

src/features/managers/
  components/ManagerSelector.tsx   manager names, avatars and domain colors
  public.ts                       deliberate client-safe export

src/features/standings/
  components/ManagerPerformanceCard.tsx

src/features/compare/
  components/ManagerComparisonCard.tsx
```

Both cards can import ManagerSelector from `@/features/managers/public`, provided those dependencies
are acyclic. ManagerSelector uses the shared SearchableSelect internally; it does not become a global
UI primitive because several features use it. Shared UI must not import Managers or another feature.
The same ownership rule applies to PlayerSelector and other domain-specific controls.

An illustrative controlled component contract:

```tsx
import { ManagerSelector } from '@/features/managers/public';

<ManagerSelector options={managers} value={selectedManagerId} onChange={setSelectedManagerId} />;
```

Options are typed, client-safe manager projections, not database/account records. The parent obtains
data through the appropriate service or existing browser-read contract and owns what a selection
means for its card. The selector owns selection presentation and interaction, not card-specific
statistics, data fetching or persistence. Browser callbacks must be defined within the client subtree,
not passed as ordinary functions from a Server Component.

Before adding a cross-feature import, check the dependency graph. If it would introduce a cycle,
consider whether the consuming feature only needs SearchableSelect with prepared options, or whether
screen-level composition can supply the domain control. Introduce a new shared abstraction only when
reuse and ownership justify it; do not move domain code into a global folder or weaken boundary checks
merely to bypass a cycle.

## Future migration sequence and acceptance

1. Inventory repeated inline UI, current primitives/templates, controls inside different cards and
   large screen files after the domain migration. Classify generic versus domain-owned reuse and
   check cross-feature dependencies. Establish original desktop/mobile behavior and visual references.
2. Reconcile token use and identify demonstrated shared visual patterns without changing appearance.
3. Extract feature components and meaningful sections, then simplify screens and pages to composition.
4. Verify typed data boundaries, loading/empty/error states, interactions, accessibility, responsive
   information parity and PWA safe-area behavior. Run relevant project checks and visual comparisons.
5. Record completed scope and remaining exceptions before moving to another UI slice.

This pass preserves existing URLs, data/access/cache contracts, appearance and interactions unless
separate changes are explicitly approved. Premium visual redesign or new animation is later work,
not an automatic consequence of component extraction.
