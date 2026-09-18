---
title: UI foundation v1
description: Initial component-system foundation for new Biwenger Stats UI work before the broader legacy UI consolidation pass.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# UI foundation v1

## Purpose and scope

This document defines the first implementation-ready UI foundation for new Biwenger Stats work.
It turns the target layering described in [UI component layering](ui-component-layers.md) into a
concrete component-system direction without starting the global legacy-UI migration.

The first intended consumer is the new season-predictions experience. It should be built on this
foundation so the project can validate the architecture against a real feature before applying it to
older screens.

This document is **not** an instruction to:

- migrate every component in `src/components`;
- redesign existing user-facing screens;
- replace feature-owned presentation that already works;
- install every library mentioned here immediately;
- normalize every historical styling decision in one pass.

Existing URLs, domain behavior, access rules, data contracts and current production visuals remain
separate compatibility concerns. The [product design context](../product/design-system.md) remains the
visual authority, while this document defines how new reusable UI should be structured.

## Audit baseline

Audit baseline: 2026-09-18, after the public Market read migration was integrated on `main`.

### Existing strengths

The project already has a strong visual identity worth preserving:

- near-black/slate application surfaces;
- sports orange `#fa5001` as the primary product accent;
- semantic foreground, muted, border, card and popover tokens;
- Outfit as the main product typeface, Bebas Neue for display typography and Inter where configured
  for compact UI;
- large but restrained radii, subtle borders, dark elevation and limited glow/glass effects;
- explicit focus-visible treatment;
- installed-PWA safe-area support;
- reduced-motion handling;
- domain-specific manager, team and statistical colors.

These decisions should survive the new foundation. The goal is to make them systematic, not replace
them with a different visual brand.

### Existing shared-UI observations

The current `src/components/ui` directory contains useful implementation knowledge, but it should not
be treated as the target design system by default.

Representative issues found during the audit:

- `Card` dispatches between multiple historical visual themes even though the product currently has one
  primary visual direction. A new foundation should prefer semantic variants over completely different
  card themes.
- `CustomSelect` combines generic selection behavior with presentation details specific to particular
  analytical screens. It is useful evidence for interaction requirements but not a clean generic contract.
- `StatsTable` combines low-level table primitives, sorting state, manager identity presentation,
  domain-oriented defaults and mobile transformation in one module. These responsibilities should be
  separable in the new system.
- desktop shared UI and mobile shared UI evolved somewhat independently. Useful pieces exist in both,
  but future primitives should be responsive by contract unless a mobile-specific interaction truly
  requires a separate component.
- several current components contain valuable visual patterns, but reuse should be based on responsibility
  and behavior rather than file age or visual similarity.

Therefore, existing components may be:

1. reused unchanged when their responsibility already fits the target;
2. wrapped temporarily by new feature code;
3. used as visual/behavioral reference while a cleaner primitive is written;
4. migrated later;
5. retired after all consumers move.

No current file is automatically canonical merely because it already lives under `src/components/ui`.

## Foundation principles

### 1. Preserve product identity, not implementation accidents

New components must use the existing product language: dark surfaces, orange primary, semantic
colors, typography and density. They do not need to preserve historical component APIs, theme
switchers or overly broad prop surfaces.

### 2. Composition over inheritance

Prefer small composable contracts:

```text
Card
├── CardHeader
├── CardContent
└── CardFooter
```

rather than a growing hierarchy of `BaseCard`, `BaseChartCard`, `BaseRankingCard` and similar
specialized parent components.

### 3. Shared UI is domain-independent

`src/components/ui` must not know what a Player, Manager, Team, Match, fantasy round or prediction is.

Domain-specific presentation belongs in the owning feature, even if several screens consume it through
a deliberate public contract.

### 4. Feature components own meaning

A generic `SearchableSelect` may belong to shared UI.

A `PlayerSelector` belongs to Players because it understands player labels, images, teams,
positions and player-specific states.

A `SeasonPredictionPlayerPicker` may belong to Season Predictions when selection semantics are unique
to that feature.

### 5. Build only demonstrated abstractions

Do not create a primitive because it might be useful someday. The first implementation should be
driven by concrete needs in Season Predictions and existing repeated patterns.

### 6. Responsive information parity

Desktop and phone presentation can differ substantially, but the underlying view model and important
information must remain equivalent. A table may become a list on mobile, but the conversion should be
an explicit feature decision, not hidden magic inside a universal table component.

### 7. Accessibility is part of the component contract

Keyboard behavior, focus visibility, semantic roles, accessible names, touch target size, dialog focus
management and reduced-motion behavior are not optional polish.

## Target layering

The practical UI stack is:

```text
Design tokens
    ↓
UI primitives
    ↓
Interactive primitives
    ↓
Reusable compositions
    ↓
Reusable domain components
    ↓
Feature cards / panels
    ↓
Feature sections
    ↓
Screens
    ↓
Next.js pages
```

Not every feature needs every layer.

## Design tokens

### Existing token authority

Continue using the CSS custom properties in `src/app/globals.css` and the Tailwind v4
`@theme inline` mapping.

Do not introduce a second theme configuration or parallel token system.

### Token categories

The foundation should gradually make these categories explicit:

#### Base visual tokens

- background;
- foreground;
- card/surface;
- popover;
- border;
- input;
- muted;
- primary;
- destructive;
- radii;
- shadows;
- spacing;
- typography.

#### Semantic tokens

Examples:

- surface-default;
- surface-raised;
- surface-subtle;
- content-primary;
- content-secondary;
- content-muted;
- border-default;
- border-strong;
- action-primary;
- status-success;
- status-warning;
- status-danger.

These semantic names may map to existing CSS variables rather than requiring an immediate new token
file.

#### Domain colors

Manager, team, competition and statistic colors retain domain ownership. They must not be folded into
brand tokens merely because they appear visually in shared components.

## Typography

The intended hierarchy is:

| Role | Default direction |
| --- | --- |
| Page display title | Bebas Neue / display face |
| Major section title | Bebas Neue / display face |
| Card title | Outfit or Inter, strong weight |
| Body | Outfit |
| Compact controls | Inter where useful |
| Numeric metrics | tabular numerals with strong weight |
| Labels / metadata | compact uppercase only when it improves scanning |

Avoid applying uppercase/display typography indiscriminately. Dense tables, long names and controls
should prioritize readability over decoration.

## Surface system

The new foundation should converge on one primary card/surface language.

### Surface

Lowest-level visual container.

Responsibilities:

- background;
- border;
- radius;
- optional elevation;
- optional interaction state.

It should not add a title, icon or analytical semantics.

Suggested semantic variants:

- `default`;
- `raised`;
- `subtle`;
- `interactive`.

### Card

A composition over Surface.

Suggested anatomy:

```text
Card
├── CardHeader
│   ├── optional icon
│   ├── optional eyebrow
│   ├── title
│   ├── optional description
│   └── optional actions
├── CardContent
└── optional CardFooter
```

Recommended configurable concerns:

- density: `comfortable | compact`;
- accent: semantic accent or none;
- interaction: static or interactive;
- optional loading state through composition rather than a completely separate visual theme.

Avoid reintroducing multiple unrelated card themes such as glass/mesh/neo unless the product explicitly
adopts them as separate supported visual modes.

## Content-pattern taxonomy

Before defining specialized feature cards, classify them by information pattern.

### Metric / KPI

Used for:

- points;
- averages;
- rank;
- accuracy;
- market value;
- wins;
- percentage deltas.

Foundation candidates:

- `Metric`;
- `MetricDelta`;
- `MetricGroup`.

Feature-level examples:

- `ManagerSeasonMetricCard`;
- `PlayerPredictionSummaryCard`.

### Ranking / list

Used when order is the primary information.

Foundation candidates:

- `DataList`;
- `ListItem`;
- `RankingList`;
- `RankingRow`.

Useful row slots:

- rank;
- leading media;
- primary label;
- secondary label;
- trailing metric;
- optional action.

Do not bake Player or Manager semantics into `RankingRow`.

### Entity identity

A recurring pattern across lists, tables, cards and selectors.

Foundation-level composition:

- `EntityIdentity`: media slot + title + subtitle + optional trailing content.

Domain wrappers may become:

- `PlayerIdentity`;
- `ManagerIdentity`;
- `TeamIdentity`.

The domain wrapper decides links, fallbacks, domain colors and metadata.

### Chart

Keep chart drawing separate from the framing UI.

Foundation candidates:

- `ChartFrame`;
- `ChartHeader`;
- `ChartLegend`;
- `ChartTooltip`;
- `ChartEmptyState`.

Domain charts own:

- dataset meaning;
- axes;
- metric formatting;
- colors with domain semantics;
- transformations and annotations.

Examples:

- `PointsEvolutionChart`;
- `MarketTrendChart`;
- `PredictionDistributionChart`.

### Table

Separate primitive table structure from analytical table behavior.

Foundation candidates:

- `Table`;
- `TableHeader`;
- `TableRow`;
- `TableCell`.

A higher-level `DataTable` may later own demonstrated generic behavior such as:

- sorting;
- column visibility;
- filters;
- pagination;
- row selection.

Do not require every table to use the high-level abstraction.

Feature tables own column definitions, domain formatting and row actions.

### Card-backed table/list/chart

`ChartCard`, `TableCard` and `RankingCard` should normally be thin compositions of `Card` plus
the corresponding content primitive. They must not become separate styling systems.

### Prediction input

Season Predictions introduces a distinct pattern:

```text
PredictionCard
├── prompt/category
├── optional description/rules
├── selection slots
└── state / validation feedback
```

The card is feature-owned. It composes shared controls and domain selectors.

## Interactive primitives

Complex browser behavior should not be reimplemented independently in every feature.

Likely shared contracts:

- `Button`;
- `IconButton`;
- `Input`;
- `SearchableSelect`;
- `Popover`;
- `Dialog`;
- `Tooltip`;
- `DropdownMenu`;
- `Tabs`;
- `SegmentedControl`.

### SearchableSelect

This is a priority component for Season Predictions.

The generic control owns:

- open/close state;
- search input;
- keyboard navigation;
- active option;
- selection;
- empty results;
- focus management;
- dismiss behavior.

It must not know about players or managers.

A domain-specific selector supplies:

- typed options;
- rendering;
- image/avatar;
- secondary metadata;
- domain colors;
- disabled rules.

## Library policy

Libraries support behavior; they do not own the product's visual identity.

### Existing and retained

| Need | Direction |
| --- | --- |
| Framework | React 19 + Next.js 16 |
| Styling | Tailwind CSS v4 |
| Tokens | Existing CSS custom properties |
| Class composition | Existing `clsx` + `tailwind-merge` / `cn` |
| Icons | Lucide |
| Charts | Recharts |
| Motion | Framer Motion |
| Search/command behavior | Existing `cmdk` where appropriate |
| Validation | Zod |
| Testing | Vitest + Playwright |

### Candidate additions

#### Radix Primitives

Candidate for complex accessible interaction behavior such as:

- Popover;
- Dialog;
- Tooltip;
- Dropdown Menu;
- Tabs;
- Select.

Adopt only where it removes repeated interaction/focus/ARIA complexity. Wrap it with Biwenger Stats
components rather than exposing third-party primitives throughout feature code.

No Radix package should be added until the first concrete component requires it.

#### TanStack Table

Candidate for complex analytical tables requiring demonstrated generic behavior such as multi-column
sorting, filtering, pagination, selection or controlled column state.

Simple semantic tables should remain plain React/HTML.

Do not add TanStack Table only to replace working static tables.

### Libraries to avoid as the primary UI layer

Do not adopt a visually opinionated component suite such as MUI, Ant Design, Chakra or similar as the
foundation. The project should own the visual system rather than override another visual system.

Reference code from external component collections may inform implementation, but copied/generated
components become project-owned code and must follow this architecture.

## Motion

Framer Motion remains appropriate for meaningful state transitions, including:

- dialog/drawer entrance and exit;
- reordering where movement communicates data changes;
- explicit expansion/collapse transitions;
- feature-specific state changes.

Avoid animation as a default property of every card, row or metric.

CSS should handle simple hover/focus/press transitions.

All new motion must continue respecting `prefers-reduced-motion`.

## Responsive strategy

### General rule

A shared primitive should normally be responsive through its own layout contract.

Create separate desktop/mobile feature components only when the information architecture or interaction
model genuinely differs.

### Tables

Do not hide meaningful information merely because a desktop table does not fit.

A feature may deliberately implement:

```text
desktop → analytical table
phone   → equivalent list/cards
```

using the same serializable view model.

The generic `DataTable` should not silently invent a mobile card representation for arbitrary
columns.

### Touch

Interactive targets should remain at least approximately 44px where practical. Bottom sheets, dialogs,
navigation and selection controls must respect PWA safe areas and viewport constraints.

## State patterns

Foundation components should provide a coherent language for:

- loading;
- empty;
- error;
- disabled;
- selected;
- pending/save-in-progress;
- success feedback.

Priority reusable components:

- `Skeleton`;
- `Spinner`;
- `EmptyState`;
- `InlineError`;
- `StatusMessage`.

Feature-specific text and recovery actions stay in the feature.

## Accessibility requirements

New foundation components must be designed with:

- semantic native elements where possible;
- visible keyboard focus;
- keyboard-operable interactive controls;
- correct labels and descriptions;
- appropriate ARIA only when native semantics are insufficient;
- focus trap/restore for modal interactions;
- Escape dismissal where expected;
- no keyboard traps;
- screen-reader-accessible selected/expanded states;
- color-independent status meaning;
- sensible touch targets;
- reduced-motion support.

Accessibility behavior belongs in tests for interactive primitives.

## Ownership and directory direction

Initial direction:

```text
src/components/ui/
  primitives/
    Button.tsx
    IconButton.tsx
    Badge.tsx
    Surface.tsx
    Avatar.tsx
    Skeleton.tsx
    Input.tsx

  controls/
    SearchableSelect.tsx
    Dialog.tsx
    Popover.tsx
    Tooltip.tsx
    Tabs.tsx

  compositions/
    Card.tsx
    Metric.tsx
    EntityIdentity.tsx
    EmptyState.tsx
    PageHeader.tsx
    SectionHeader.tsx
    ChartFrame.tsx
    DataList.tsx
    DataTable.tsx

src/features/players/components/
  PlayerIdentity.tsx
  PlayerSelector.tsx

src/features/managers/components/
  ManagerIdentity.tsx
  ManagerSelector.tsx

src/features/season-predictions/components/
  SeasonPredictionsScreen.tsx
  PlayerPredictionCard.tsx
  ManagerPredictionCard.tsx
```

This tree is directional, not a mandate to create empty folders or every listed component immediately.
Only add files when a real consumer exists.

## Public contracts

Shared UI must expose deliberate client-safe entrypoints.

Feature-owned reusable UI crosses a feature boundary only through that feature's `public.ts`.

Examples:

```tsx
import { SearchableSelect } from '@/components/ui';
import { PlayerSelector } from '@/features/players/public';
```

Avoid foreign feature deep imports.

Shared UI must never import domain features.

## Season Predictions pilot

Season Predictions is the first recommended consumer of the new foundation because it is new work and
does not require preserving a historical component tree.

The first slice should be intentionally small.

### Required foundation for the first usable screen

Candidate minimum:

- `Surface`;
- `Card` anatomy;
- `Button`;
- `IconButton` if required;
- `Badge`;
- `Avatar`;
- `PageHeader`;
- `SectionHeader`;
- `EntityIdentity`;
- `SearchableSelect`;
- loading/empty/error presentation needed by the feature.

### Feature-owned components

Likely:

- `SeasonPredictionsScreen`;
- `PlayerPredictionCard`;
- `ManagerPredictionCard`;
- prediction category/slot components;
- Player/Manager picker wrappers where feature-specific behavior is required.

Do not build chart/table foundations merely because they are planned for the wider application if the
first Season Predictions scope does not need them.

## Implementation sequence

### UI-00 — Foundation specification

This document plus the audit of existing tokens/components/libraries.

Acceptance:

- component responsibilities defined;
- library policy defined;
- visual identity preserved;
- ownership boundaries explicit;
- no production implementation or dependency changes required.

### UI-01 — Minimal primitives

Implement only the primitives required by the Season Predictions first slice.

Expected focus:

- Surface/Card anatomy;
- Button;
- Badge;
- Avatar/EntityIdentity;
- headers;
- loading/empty states.

Use TypeScript/TSX for new boundaries.

### UI-02 — Selection controls

Implement the generic selection interaction and the first domain wrapper.

Expected focus:

- SearchableSelect;
- Player/Manager option presentation;
- keyboard/focus behavior;
- responsive popover/sheet behavior where needed.

This is the first point at which a headless interaction dependency such as Radix may be justified.

### UI-03 — Season Predictions pilot

Build the new feature using only the foundation contracts.

Validate:

- desktop;
- narrow phone;
- long names;
- empty option sets;
- loading;
- validation states;
- keyboard;
- touch;
- PWA safe-area interaction.

### UI-04 — Foundation review

After a complete real screen exists, review:

- which abstractions were useful;
- which props became overly broad;
- which missing patterns are demonstrated;
- whether Radix/cmdk integration is appropriate;
- whether any component belongs to a domain instead of shared UI.

Only after this review should the foundation be considered the default for additional new screens.

### Later — Legacy UI migration

The broader UI consolidation remains incremental and follows domain migration/readiness.

Existing feature screens should not be rewritten solely to achieve directory uniformity. Migrate a
legacy UI slice only when its ownership is understood and visual regression evidence can protect the
existing experience.

## Testing strategy

### Primitive tests

Interactive primitives require focused behavior tests for:

- keyboard;
- focus;
- disabled states;
- open/close;
- selection;
- accessible names/state.

### Feature tests

Feature components test domain behavior and view-model rendering, not implementation details of the
shared primitive.

### Browser verification

New UI foundation work must be checked at representative desktop and phone viewports, including:

- visual consistency;
- long content;
- focus states;
- touch interaction;
- overlays near viewport edges;
- loading/empty/error states;
- reduced-motion where relevant.

Existing Playwright visual-regression infrastructure should be reused when a screen becomes stable.

## Non-goals for v1

The first foundation does not attempt to define or implement:

- a general theme switcher;
- multiple visual card themes;
- a universal chart abstraction hiding Recharts;
- a universal table abstraction for every data set;
- all form controls;
- date/calendar systems;
- toast/notification infrastructure unless the first feature requires it;
- drag-and-drop;
- a Storybook/design-system site;
- global legacy-component replacement;
- a new brand direction.

## Open decisions

Resolve these only when implementation reaches the corresponding need:

1. whether Radix primitives should become the standard low-level overlay/control dependency;
2. whether TanStack Table is warranted by the first complex table migration;
3. whether generic responsive selection uses Popover on desktop and Bottom Sheet/Dialog on phone;
4. whether existing `MobileBottomSheet` is retained, wrapped or replaced during the first relevant
   control migration;
5. whether the current PageHeader visual becomes the new canonical composition or is recreated on the
   new primitives while preserving its appearance;
6. whether a dedicated UI showcase route becomes useful after several foundation components exist.

## Definition of success

UI Foundation v1 succeeds when:

- a new feature can be built without creating new legacy-style global components;
- shared primitives remain genuinely domain-independent;
- feature components own domain semantics;
- new UI visually belongs to Biwenger Stats;
- desktop and mobile remain coherent;
- keyboard, focus and touch behavior are deliberate;
- dependency additions are justified by demonstrated interaction complexity;
- the first Season Predictions screen can validate the system before broader migration.
