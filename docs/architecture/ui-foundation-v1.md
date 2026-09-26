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

The first production consumer is the application shell/chrome, followed by Season Predictions as the
first new-page validation. This validates the architecture against real surfaces before applying it to
older screens.

This document is **not** an instruction to:

- migrate every component in `src/components`;
- redesign existing user-facing screens;
- replace feature-owned presentation that already works;
- install every library mentioned here immediately;
- normalize every historical styling decision in one pass.

Existing URLs, domain behavior, access rules and data contracts remain separate compatibility concerns.\nThe [product design context](../product/design-system.md) defines stable visual rules and the\n[UI design direction](../product/ui-design-direction.md) defines the approved visual evolution. This\ndocument defines how reusable UI is structured so those designs can evolve without rewriting domain\narchitecture.

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

The foundation feeds two major UI consumers in parallel:

```text
                 Design tokens
                      ↓
                UI foundation
               ↙             ↘
      Application shell     Feature UI
               \             /
                \           /
                  Next.js pages
```

The application shell is part of the UI migration. It is not a feature domain, but it owns the
persistent product frame in which feature screens are rendered.

## Application shell architecture

The complete UI migration includes the persistent application shell as a first-class scope.

The shell owns global presentation and navigation that is visible across many or all routes. It must
consume the same design tokens and shared primitives as feature UI, but it is allowed to know about
application-level navigation and route structure.

### Shell responsibilities

The target shell includes:

- application background and ambient decoration;
- main content frame and page-width constraints;
- desktop sidebar/navigation;
- top application header;
- global search entry point;
- season selector;
- account/settings actions;
- optional global news/ticker surface;
- footer;
- phone bottom navigation;
- global mobile menu / more sheet;
- route-level loading/progress presentation;
- PWA safe-area handling;
- persistent spacing/clearance around fixed navigation.

These responsibilities are global UI. They should not be reimplemented by individual features.

### Shell versus feature ownership

The shell owns **where** a global capability appears. The relevant feature owns **what the capability
means and where its data comes from**.

Examples:

```text
Search feature
    ↓ client-safe search contract
AppHeader / global search composition

News feature
    ↓ news projection
AppHeader or shell NewsTicker

Season infrastructure
    ↓ available seasons / selected season
Shell SeasonSelector
```

The shell must not absorb domain queries or domain business rules merely because it renders their
entry points.

### Shell target direction

The shell migration establishes the canonical presentation-ownership pattern for the rest of the UI
migration. Organize by **ownership first**, then by presentation where desktop and phone/PWA genuinely
need different compositions.

Directional structure:

```text
src/
  app/
    (app)/
      ...                    # routing/orchestration only

  components/
    ui/
      primitives/            # domain-independent base UI
      controls/              # reusable interactions
      compositions/          # reusable domain-independent compositions

    shell/
      AppShell.tsx            # presentation-mode orchestration
      shared/
        AppBackground.tsx
        AppMain.tsx
        AppBrand.tsx
        NavigationFeedback.tsx
        navigation.ts
      desktop/
        DesktopShell.tsx
        AppHeader.tsx
        Sidebar.tsx
        AppFooter.tsx
      mobile/
        MobileShell.tsx
        MobileNavigation.tsx
        MobileMoreMenu.tsx
      integrations/
        GlobalSearch.tsx
        SeasonSelector.tsx
        AccountMenu.tsx

    mobile/
      ...                    # reusable phone-only, domain-independent page compositions

  features/
    <domain>/
      public.ts
      server.ts
      models/
      server/
      components/
        shared/
        desktop/
        mobile/
      screens/
        desktop/
        mobile/
```

Not every optional folder must exist for a small feature. Create `shared/`, `desktop/`, or `mobile/`
when the distinction improves ownership and navigation rather than to satisfy a directory template.

Ownership rules:

- `src/app` owns URLs, route params, guards/auth orchestration, presentation detection and wiring to
  feature/shell contracts. Route files stay thin and do not own full desktop/mobile implementations.
- `src/components/ui` owns domain-independent UI only.
- `src/components/shell` owns persistent application chrome and **where** global capabilities appear.
  It may know route/navigation structure but must not absorb Search, News, Season or Auth business logic.
- `src/components/mobile` may retain reusable phone-specific compositions such as screen scaffolds,
  bottom sheets or mobile-only interaction patterns when they are domain-independent. It must not become
  a home for feature-specific screens.
- `src/features/<domain>` owns feature meaning and both desktop/mobile feature presentation.
  A `MobileMarketScreen`, `MobileDashboardScreen` or `MobileLineupScreen` belongs to its feature,
  not to a global mobile-screen folder.
- desktop and mobile should share view models, contracts and meaningful subcomponents when semantics are
  identical, but they may use separate top-level screens when information hierarchy or interaction differs.

The current `src/components/layout`, legacy `src/components/ui`, global mobile-screen files and mixed
feature screen conventions are migration inputs, not final ownership. Do not perform a repository-wide
directory-only refactor before shell work. The AppShell slice establishes this pattern first; each later
feature UI migration moves only the files owned by that feature and proves its cleanup before completion.

### Shell migration order

The shell should be migrated after the shared foundation is stable enough to support it and after the
relevant domain contracts used by global search/news/navigation are clear.

A likely sequence is:

1. app background and content frame;
2. shared shell actions and navigation item primitives;
3. desktop sidebar and header;
4. phone bottom navigation and mobile menu;
5. global search/season/account integrations;
6. footer and global news/ticker surfaces;
7. legacy shell cleanup and visual-regression verification.

The shell slice is complete only when the new shell is the sole owner of persistent application chrome:
old shell files, compatibility exports and styling are deleted once repository-wide consumer checks prove
they are unused. Do not keep duplicate old/new shell implementations merely as a precaution.

This shell migration is part of the complete UI migration and establishes the file-ownership convention
that later feature UI migrations follow.

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

Similarly, domain-specific styling (such as `--manager-card-bg`) and runtime shell layout variables
(such as `--app-header-height` and `--app-safe-area-top`) remain outside the global token foundation.

### Token file architecture

The target foundation uses two explicit token files:

```text
src/styles/tokens/
  base-tokens.css
  semantic-tokens.css
```

`base-tokens.css` owns raw design values. These tokens describe what values exist, not what they mean.

Examples:

```css
:root {
  --color-obsidian-deepest: 240 5% 2%;
  --color-obsidian-deep: 240 4% 7%;
  --color-white-bright: 0 0% 98%;
  --color-orange-strong: 19 99% 49%;
  --color-red-strong: 0 84% 60%;

  --radius-rounded: 1rem;
}
```

`semantic-tokens.css` assigns product meaning to those values.

Examples:

```css
:root {
  --surface-app: var(--color-obsidian-deepest);
  --surface-card: var(--color-obsidian-deep);
  --content-primary: var(--color-white-bright);
  --action-primary: var(--color-orange-strong);
  --status-danger: var(--color-red-strong);
}
```

New UI should depend on semantic meaning wherever possible. A Button should ask for the primary-action
color, not know that the product currently uses a particular orange. A Card should consume a surface
token, not a raw obsidian palette value.

### Incremental token migration

The token extraction must not require deleting `globals.css` or changing the visual output of the
application in one step.

The migration uses a compatibility bridge.

#### Stage T0 — establish the baseline

Before moving token declarations:

- record the current token values;
- keep existing browser/visual baselines;
- run normal verification;
- treat any visual difference in the extraction commit as a regression.

#### Stage T1 — introduce the two token files

Create:

```text
src/styles/tokens/base-tokens.css
src/styles/tokens/semantic-tokens.css
```

Initially, base tokens should be extracted from values that already exist in `globals.css`.
Do not redesign the palette during this step.

Semantic tokens map those base values to UI meaning.

#### Stage T2 — load tokens through globals.css

`src/app/globals.css` remains the single global stylesheet entry point loaded by the root layout.

Its top-level structure becomes conceptually:

```css
@import 'tailwindcss';
@import '../styles/tokens/base-tokens.css';
@import '../styles/tokens/semantic-tokens.css';

@theme inline {
  /* Tailwind bridge to semantic tokens */
}

/* true global/base styles */
/* temporary legacy styles still awaiting migration */
```

The root layout does not need to import every token file separately. `globals.css` acts as the
composition root for global CSS.

#### Stage T3 — preserve legacy token aliases

Existing components currently consume names such as:

```text
--background
--foreground
--card
--primary
--muted
--border
--ring
--sidebar-background
...
```

Do not break those consumers during extraction.

`semantic-tokens.css` should temporarily expose compatibility aliases that resolve to the new
canonical semantic tokens.

Example:

```css
:root {
  --surface-app: var(--color-obsidian-deepest);
  --surface-card: var(--color-obsidian-deep);
  --action-primary: var(--color-orange-strong);

  /* Legacy compatibility bridge */
  --background: var(--surface-app);
  --card: var(--surface-card);
  --primary: var(--action-primary);
}
```

This makes the new token system active immediately while old code continues resolving exactly the
same values.

The existing Tailwind `@theme inline` mapping can continue exposing utilities such as
`bg-background`, `text-foreground` and `border-border` during the transition.

#### Stage T4 — keep globals.css, but shrink its responsibility

The goal is **not** necessarily to delete `globals.css`.

A final global stylesheet still has legitimate responsibilities:

- Tailwind import/theme bridge;
- token imports;
- document/body defaults;
- global focus behavior;
- accessibility helpers;
- true app-wide reset/base rules.

What should gradually leave `globals.css` are implementation-specific concerns such as:

- historical card styling;
- feature-specific utilities;
- shell component styling that belongs with the new shell;
- mobile component implementations;
- obsolete animation/theme experiments.

The current large `globals.css` therefore becomes smaller incrementally rather than disappearing.

#### Stage T5 — new UI uses canonical semantics

All new foundation components should consume the new semantic system rather than introduce new raw
colors or depend on legacy-only aliases.

Examples:

```text
Button        → action semantics
Surface       → surface semantics
Card          → surface + border + radius semantics
Muted text    → content-muted
Error state   → status-danger
```

Tailwind utilities may remain the rendering mechanism as long as their `@theme` mapping points to the
canonical semantic tokens.

#### Stage T6 — migrate legacy consumers slice by slice

When an existing component or shell slice is migrated:

1. identify its raw colors and legacy token references;
2. map them to canonical semantic tokens;
3. move component-specific styling out of global CSS when appropriate;
4. verify visual parity;
5. remove only aliases/utilities that have no remaining consumers.

Do not remove a legacy token merely because the new foundation no longer uses it.

#### Stage T7 — retire compatibility aliases

Only after repository-wide consumer checks show that a legacy token name has no remaining runtime
consumer should its alias be removed.

The end state is:

```text
base-tokens.css
      ↓
semantic-tokens.css
      ↓
Tailwind/theme bridge
      ↓
UI foundation + shell + features
```

with `globals.css` acting as a small global composition/root stylesheet rather than the owner of
every visual concern.

### Token migration safety rule

Token extraction and visual redesign are separate operations.

The first token commits must preserve the exact current rendered values. Improvements to palette,
spacing scales, radii or visual hierarchy should be made in later explicit design changes with browser
comparison, not hidden inside the file split.

### Theme-ready semantic architecture

The token foundation must support the user preference model recorded in
[ADR-0008](../decisions/0008-semantic-theme-preferences.md):

```text
system | dark | light
```

Theme selection belongs at the application root/shell. Shared UI and feature components consume
semantic tokens and remain unaware of whether the resolved theme is light or dark.

Target dependency:

```text
raw dark/light palette values
          ↓
theme-aware semantic mapping
          ↓
Tailwind semantic bridge
          ↓
Surface / Card / primitives / shell / feature UI
```

The dark semantic mapping remains the compatibility baseline. UI-01T added the light raw palette,
light semantic mapping, root preference resolution and persistence; UI-01H hardened rollout boundaries:
`system` remains the target/preferred user preference default for the fully migrated product, while during
the incremental legacy UI rollout, absence of a stored preference resolves to `dark` so unmigrated screens
remain on the compatibility baseline. Explicit `dark`, `light`, and `system` preferences remain fully supported;
concrete runtime contracts are recorded in [ADR-0008](../decisions/0008-semantic-theme-preferences.md).

Do not implement theming by cloning component trees or by spreading component-local `dark:` variants
through the new foundation.

Surface hierarchy (`default | raised | subtle`) is independent from color theme.

### Layout-neutral foundation

The shared foundation must not assume that pages are grids of Cards.

It must support feature screens composed from:

- open canvas regions;
- bounded Cards;
- focal/hero regions;
- data rails;
- full-width charts/tables;
- split views;
- drawers/sheets;
- responsive desktop/mobile compositions.

Those are presentation choices above the primitive layer. Services/view models must remain independent
from those choices so page design can evolve over time.

## Typography

The intended hierarchy is:

| Role                | Default direction                                |
| ------------------- | ------------------------------------------------ |
| Page display title  | Bebas Neue / display face                        |
| Major section title | Bebas Neue / display face                        |
| Card title          | Outfit or Inter, strong weight                   |
| Body                | Outfit                                           |
| Compact controls    | Inter where useful                               |
| Numeric metrics     | tabular numerals with strong weight              |
| Labels / metadata   | compact uppercase only when it improves scanning |

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

UI-01A semantic variants:

- `default`;
- `raised`;
- `subtle`.

Interaction is an independent `interactive?: boolean` visual treatment, not a variant or button
behavior. Surface uses one canonical `--radius-surface` and owns no padding. Raised hierarchy uses
the existing popover surface; UI-01A introduces no new elevation token.

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

UI-01A configurable concerns:

- density: `comfortable | compact`;
- surface variant: `default | raised | subtle`;
- interaction: `interactive?: boolean`, defaulting to false;
- loading/empty/error content through composition, with no state or accent/theme props on Card.

Card owns root padding and gaps (`comfortable` by default); nested cards choose density independently
without React context. Header accepts `icon`, `eyebrow` and `action` nodes. CardTitle uses an explicit
`as: 'h2' | 'h3' | 'h4'` choice, defaulting to `h3`, independently of visual size.

New consumers opt into `@/components/ui/foundation`; `@/components/ui` retains the legacy Card.
Surface and the Card anatomy require no client boundary. During coexistence, Surface consumes
`--surface-card` directly to avoid the legacy `.bg-card` border/transition override. Its interactive
border rules locally override the unlayered universal border color, and CardTitle locally overrides
the global heading typography. Future primitives must check these global CSS interactions without
changing existing consumers.

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

| Need                    | Direction                                 |
| ----------------------- | ----------------------------------------- |
| Framework               | React 19 + Next.js 16                     |
| Styling                 | Tailwind CSS v4                           |
| Tokens                  | Existing CSS custom properties            |
| Class composition       | Existing `clsx` + `tailwind-merge` / `cn` |
| Icons                   | Lucide                                    |
| Charts                  | Recharts                                  |
| Motion                  | Framer Motion                             |
| Search/command behavior | Existing `cmdk` where appropriate         |
| Validation              | Zod                                       |
| Testing                 | Vitest + Playwright                       |

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

Responsive behavior is not a separate layer in the hierarchy. It is a decision made at the lowest
layer where desktop and phone behavior actually diverge.

Default rule:

> keep one component while the responsibility, information hierarchy and interaction model remain the
> same; split desktop and phone components only when those responsibilities materially diverge.

This means most low-level UI stays shared:

```text
tokens                 shared
primitives             shared
Button                 shared
Badge                  shared
Avatar                 shared
Surface                shared
Card                   shared
EntityIdentity         usually shared
SearchableSelect       shared behavior, adaptive presentation allowed
```

A primitive can change padding, typography, stacking or dimensions at breakpoints without becoming a
different mobile component.

### Where desktop/mobile differentiation normally begins

The split usually becomes meaningful at the **composition, feature component, section or screen**
levels.

#### Same component, responsive layout

Use one component when only layout changes:

```text
MetricCard
desktop → horizontal supporting metrics
phone   → stacked supporting metrics
```

```text
PlayerIdentity
desktop → larger avatar + metadata inline
phone   → smaller avatar + metadata stacked
```

The responsibility and content remain the same, so the component remains shared.

#### Shared behavior, different presentation shell

Interactive controls may keep one logical contract while adapting their container:

```text
SearchableSelect
desktop → Popover
phone   → Bottom Sheet / Dialog
```

Search, selection, active option and keyboard semantics stay shared. Only the presentation mechanism
changes.

This can be implemented internally through an adaptive wrapper or through two private renderers behind
one public contract. Do not force consumers to know about desktop versus phone unless the feature truly
needs that distinction.

#### Separate feature components

Create separate desktop/phone components when information architecture or interaction changes enough
that a single component becomes conditional and difficult to understand.

Example:

```text
Standings
desktop → dense comparative table with many simultaneous columns
phone   → focused manager list with expandable/detail navigation
```

Possible ownership:

```text
StandingsScreen
├── DesktopStandingsView
└── MobileStandingsView
```

Both consume the same feature view model. They do not duplicate queries or business calculations.

#### Separate screens

Use separate screens only for a substantial route-level presentation difference, such as when desktop
and phone compose different sections or navigation patterns.

The split should therefore happen as late/high in the hierarchy as necessary, not as early as possible.

### Decision test

Before creating `MobileX` and `DesktopX`, ask:

1. Is the data/view model the same?
2. Is the semantic responsibility the same?
3. Is the information priority the same?
4. Is the interaction model the same?
5. Can normal responsive CSS solve the difference cleanly?

If the answer is yes to the first four and responsive CSS is clean, keep one component.

If information priority or interaction changes materially, split at that composition/feature/screen
boundary while keeping lower-level primitives shared.

### Naming

Do not prefix every responsive component with `Mobile` or `Desktop`.

Prefer neutral names for shared components:

```text
Card
EntityIdentity
PlayerSelector
PredictionCard
```

Use explicit responsive names only when two real implementations exist:

```text
DesktopStandingsView
MobileStandingsView
```

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

src/components/shell/
  AppShell.tsx
  AppBackground.tsx
  AppHeader.tsx
  Sidebar.tsx
  Footer.tsx
  MobileNavigation.tsx

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

### UI-01 — Foundation primitives and design readiness

UI-01 establishes the foundational token, theming and primitive layers:

1. **UI-01A — surface and card foundation (complete):** established `Surface` and the composable `Card`
   anatomy (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) on
   the semantic-token foundation.
2. **UI-01T — theme foundation (complete):** integrated at `55765dfe`. Added the light raw palette,
   theme-aware semantic mappings (`:root[data-theme='light']`),
   synchronous `<head>` bootstrap script (`THEME_BOOTSTRAP_SCRIPT`), root `system | dark | light`
   resolution, persistence store and comprehensive theme verification.
3. **UI-01B — core primitives (complete):** integrated at `665fd1d7` via
   [PR #44](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/44); see the
   [UI-01B receipt](../migration/reports/ui-01b-core-primitives.md). Implemented `Button`, `IconButton`,
   `Input`, `Badge`, `Avatar` and `Skeleton` on additive semantic tokens (`--action-primary-content`,
   `--control-surface`, `--control-content`, `--control-placeholder`, `--control-border`, and
   theme-independent `--radius-compact: 0.5rem` → `--radius-control: var(--radius-compact)`). Resolves
   WCAG AA primary action contrast (dark 6.35:1, light 5.83:1) without modifying legacy `--primary-foreground`.
   Supports React Server Components without `'use client'` and exports exclusively through
   `@/components/ui/foundation`.
4. **UI-01H — Foundation rollout hardening (this milestone):** protect unmigrated legacy UI: `system` remains the target default preference once migrated, while missing/invalid preferences resolve to the dark compatibility baseline during rollout; remove automatic no-JS light fallback; make `ThemeContext` enforce its provider boundary; and verify hydration safety across SSR and client stores. Light mode infrastructure is preserved for explicit opt-in.
5. **First production adoption — Application shell / chrome migration:** migrate the global chrome (`AppShell`, `Sidebar`, `TopHeader`, `MobileNavigation`, footer, safe areas) onto the new foundation.
6. **UI-01C — shared compositions (demand-driven):** extract reusable identity (`EntityIdentity`), `EmptyState`, and header patterns (`PageHeader`, `SectionHeader`) from demonstrated shell and page reuse, rather than speculative creation.
7. **UI-02 — Interactive controls & overlays:** selectors, searchable select, overlays, and dialogs where needed.

Do not implement every possible primitive in advance.

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
- immediate global legacy-component replacement in the v1 pilot;
- a new brand direction.

The **complete UI migration**, however, does include the application shell and eventual retirement or
migration of legacy shared/mobile UI once the new foundation has been validated.

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
