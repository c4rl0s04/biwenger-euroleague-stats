---
title: Product design context
description: Stable visual, theming, responsive, and interaction rules for Biwenger Stats.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Product design context

Biwenger Stats is a EuroLeague fantasy analytics application. Its core work is scanning results,
comparing players and teams, following league activity, and making fantasy decisions.

This document defines **stable product-design rules**. The current visual evolution and page
composition direction lives in [UI design direction](ui-design-direction.md). Reusable component
structure lives in the [UI foundation](../architecture/ui-foundation-v1.md).

## Product identity

The product should feel like modern sports analytics rather than a generic administration dashboard.

Stable identity:

- sports orange remains the primary brand accent;
- data legibility takes precedence over decoration;
- Outfit is the primary product sans family;
- Bebas Neue is available for display/focal typography;
- Inter may support compact UI where configured;
- dark and light modes express the same product identity;
- team, manager and statistic colors preserve domain meaning;
- motion is restrained and explanatory;
- desktop and phone may compose the same information differently.

## Theme architecture

The target preference model is:

```text
System
Dark
Light
```

`System` is the default.

Theme selection changes semantic-token mappings, not component structure. Shared UI, shell and feature
components must consume semantic roles rather than contain independent dark/light palettes.

See [ADR-0008](../decisions/0008-semantic-theme-preferences.md).

The current dark values remain the compatibility baseline during migration. Light mode must be
designed deliberately, with appropriate surface hierarchy and contrast; it must not be produced by
simply inverting dark colors.

Avoid making widespread component-level `dark:` branches the default theming mechanism. Prefer:

```text
raw/base palette
      ↓
theme-aware semantic tokens
      ↓
Tailwind semantic bridge
      ↓
components
```

Domain colors must remain readable in both themes. If raw domain colors do not meet contrast needs,
adapt their presentation semantically rather than duplicating whole components.

## Token authority

The canonical token files are:

```text
src/styles/tokens/base-tokens.css
src/styles/tokens/semantic-tokens.css
```

`src/app/globals.css` remains the global CSS composition root and Tailwind theme bridge during the
migration.

New UI should consume semantic utilities/tokens. Do not introduce a second theme configuration or
hard-code repeated brand/surface colors inside components.

Compatibility aliases exist temporarily for legacy consumers and are not the preferred API for new
foundation code.

## Visual hierarchy

Pages should not default to a uniform grid of rounded Cards.

Before choosing a container, identify:

1. the primary question/object on the page;
2. information that deserves focal hierarchy;
3. information that benefits from direct placement on the application canvas;
4. information that needs bounded grouping;
5. information that should be progressively disclosed.

Cards are appropriate when their bounded grouping has a real purpose. Open analytical sections,
full-width charts/tables, rails, split views and contextual drawers are equally valid.

See [UI design direction](ui-design-direction.md) for the current pattern vocabulary.

## Surface language

The new foundation converges on one coherent surface system rather than historical Card themes.

Current foundation hierarchy:

- `default`;
- `raised`;
- `subtle`.

These represent information/elevation hierarchy, **not dark/light themes and not arbitrary color
themes**.

Legacy Standard/Glass/Mesh/Neo/Elegant Card variants remain compatibility code until their consumers
migrate. They are not the target design model.

## Typography

Use typography to create hierarchy before adding extra decoration.

- display typography: page focal titles and selected major section headings;
- strong sans typography: cards, controls and analytical labels;
- body typography: explanatory copy;
- tabular numerals: metrics where alignment/scanning matters.

Do not apply uppercase/display styling indiscriminately. Long entity names, controls and dense tables
must prioritize readability.

## Application canvas and shell

The shell owns global presentation such as:

- application background;
- content width/gutters;
- sidebar/navigation;
- top header;
- footer;
- phone bottom navigation;
- global search;
- season selection;
- global news/ticker surfaces;
- route loading/progress;
- installed-PWA safe areas.

Features should not reimplement these concerns.

The canvas must allow content to live directly on the page. A feature should not need a Card merely to
obtain a background or spacing context.

## Desktop behavior

Desktop is an analytical workspace.

It may use:

- persistent navigation;
- contextual headers and filters;
- full-width visualizations/tables;
- split views;
- simultaneous comparisons;
- higher information density.

Do not constrain every dataset to dashboard tiles.

## Phone behavior

Phone is a focused sports-app experience, not a scaled-down desktop dashboard.

It may use:

- compact sticky headers;
- focal identity/metric regions;
- metric rails;
- focused charts;
- readable lists;
- progressive disclosure;
- bottom navigation;
- bottom sheets or full-height sheets.

Desktop and phone should preserve information parity even when presentation differs.

Use existing PWA safe-area behavior and appropriate touch targets.

## Data visualization

Charts remain part of the analytical language, not decoration.

Keep:

- units and labels explicit;
- series colors stable within a domain;
- tooltips readable;
- legends meaningful;
- empty/loading/error states deliberate.

A shared chart frame may standardize presentation, but domain charts retain ownership of data meaning,
axes, transformations and annotations.

Recharts remains the current charting library unless a demonstrated requirement justifies another
choice.

## Tables, lists and rankings

Choose presentation based on the task.

Use tables when simultaneous column comparison matters. Use lists/rankings when ordered entities and a
small number of metrics are primary.

Do not hide important desktop columns on phone without an equivalent mobile representation.

A future high-level DataTable may standardize generic behavior, but simple semantic tables should not
be forced into a complex abstraction.

## Color use

Brand orange communicates product/action emphasis.

Other colors should normally communicate:

- domain identity;
- status;
- positive/negative meaning;
- selection;
- comparison;
- data series.

Avoid decorative color variety solely to make Cards look different.

Color meaning must have non-color cues where needed for accessibility.

## Motion

Use motion when it explains:

- navigation;
- opening/closing overlays;
- selection;
- expansion;
- reordering;
- meaningful state change.

Avoid default entrance/lift/glow animation on every surface.

Respect `prefers-reduced-motion`.

## Interaction and accessibility

New UI requires:

- semantic native elements where possible;
- visible keyboard focus;
- keyboard-operable controls;
- useful accessible names;
- no keyboard traps;
- focus management/restoration for overlays;
- appropriate touch target size;
- color-independent status meaning;
- reduced-motion support.

Responsive visual polish does not override accessibility requirements.

## State coverage

Loading, empty, error, disabled, pending, selected, success, not-found, long-name and narrow-viewport
states are part of the design.

Do not treat them as afterthoughts after the ideal populated desktop view.

## Designing for change

The UI architecture must make future redesign cheaper.

Keep:

- domain data/view models independent from Card/table/rail placement;
- shared styling independent from feature meaning;
- theme selection independent from component trees;
- responsive presentation separate from domain services;
- page composition flexible rather than locked to a universal dashboard template.

Changing a page from a Card grid to an open analytical layout should not require rewriting queries or
services.

## Migration modes

### Structural compatibility

Use when reorganizing existing UI without approved redesign.

Preserve current appearance/interactions and protect visual baselines.

### Explicit design evolution

Use when a task explicitly approves a visual/product change.

Define:

- target hierarchy;
- dark/light behavior once available;
- desktop target;
- phone target;
- changed interactions;
- reviewed visual-baseline updates.

Do not hide redesign inside an unrelated architecture refactor.

## Representative current surfaces

Useful migration references include:

- Team Profile — feature-owned desktop/mobile profile presentation;
- Matches — schedule and round browsing;
- current mobile screens — existing phone interaction behavior;
- current AppShell — existing navigation and persistent UI;
- Season Predictions — planned first new-page pilot for the new design direction.

These are references, not templates that future pages must copy.
