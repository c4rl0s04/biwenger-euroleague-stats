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

| Layer | Responsibility | Examples and ownership |
| --- | --- | --- |
| Design tokens | Central visual values and semantic roles | Colors, spacing, typography, radii and shadows; build on existing global CSS tokens and Tailwind mapping |
| UI primitives | Small domain-independent visual elements | Button, badge, input, card frame, skeleton; shared UI |
| Reusable compositions | Repeated combinations of primitives, without domain rules | Metric tile, chart frame, empty-state panel; share only when actual reuse justifies it |
| Feature components | Domain-specific content and interactions | StandingsTable, PlayerStatisticsCard, MatchRow; owning feature |
| Feature sections | Group related feature components into a meaningful screen region | RankingSection, PerformanceSection; owning feature, optionally using the shared Section container |
| Screens | Arrange imported sections and components for desktop/mobile | StandingsScreen; owning feature |
| Pages | Adapt framework inputs and render the feature screen | Next.js page files; no embedded domain presentation implementation |

The existing shared Section or Card template is a visual container, not the implementation of
every domain section or card. A RankingSection can live in its own file, use Section internally,
and compose StandingsTable and other relevant feature components.

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

## Future migration sequence and acceptance

1. Inventory repeated inline UI, current primitives/templates and large screen files after the
   domain migration. Establish original desktop/mobile behavior and visual references.
2. Reconcile token use and identify demonstrated shared visual patterns without changing appearance.
3. Extract feature components and meaningful sections, then simplify screens and pages to composition.
4. Verify typed data boundaries, loading/empty/error states, interactions, accessibility, responsive
   information parity and PWA safe-area behavior. Run relevant project checks and visual comparisons.
5. Record completed scope and remaining exceptions before moving to another UI slice.

This pass preserves existing URLs, data/access/cache contracts, appearance and interactions unless
separate changes are explicitly approved. Premium visual redesign or new animation is later work,
not an automatic consequence of component extraction.
