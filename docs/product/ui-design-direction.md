---
title: UI design direction
description: Target visual and interaction direction for the evolving Biwenger Stats desktop and mobile experience.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# UI design direction

This document defines the target **product experience** for the UI migration. The
[UI foundation](../architecture/ui-foundation-v1.md) defines how reusable UI is structured; this note
defines what the product should feel like and which page-composition patterns the foundation must
support.

The current dark analytics interface is the compatibility baseline, not the final limit of the design
system. New UI work may deliberately improve visual hierarchy and interaction when its scope says so,
provided domain behavior, data contracts, accessibility and responsive information parity remain
protected.

## Product goal

Biwenger Stats should feel like a modern sports analytics product rather than a generic admin
dashboard.

The experience should combine:

- dense, trustworthy analytics;
- clear sports identity;
- a small number of strong focal moments;
- progressive disclosure for secondary detail;
- quiet application chrome;
- fast scanning of numbers, rankings, matches and trends;
- deliberate desktop and phone compositions;
- a coherent light and dark visual identity.

Modern does **not** mean adding more glow, gradients or animation everywhere. Hierarchy, typography,
spacing, responsive behavior and meaningful interaction should do most of the work.

## Core visual principles

### One product identity across themes

Dark and light modes are two expressions of the same product, not separate component systems.

The sports-orange brand accent, typography hierarchy, component anatomy and domain semantics remain
recognizable in both. Components consume semantic tokens and must not own theme-specific palettes.

See [ADR-0008](../decisions/0008-semantic-theme-preferences.md).

### Hierarchy before containers

A rounded bordered Card is one presentation tool, not the default wrapper for every piece of
information.

Pages should first decide:

1. what is the focal information;
2. what needs simultaneous comparison;
3. what can live directly on the application canvas;
4. what needs containment;
5. what should be progressively disclosed.

Adding a Card around content is not a substitute for information architecture.

### Sports-first presentation

Use the nature of the product when it improves comprehension or personality:

- player and manager identity;
- team marks and domain colors;
- matchup presentation;
- rankings and podiums;
- form and momentum;
- round timelines;
- court-oriented visuals when data justifies them;
- live/upcoming/completed states;
- season context.

Sports decoration must not reduce data legibility.

### Data legibility over visual novelty

Numbers, units, rankings, dates, legends and chart series must remain easy to read. Decorative effects
are secondary.

Use color where it communicates:

- selection;
- state;
- positive/negative meaning;
- domain identity;
- emphasis;
- interactivity.

Avoid making every analytical block a different decorative color theme.

### Progressive disclosure

Do not display every secondary metric simultaneously merely because the data exists.

Use:

- drawers;
- bottom sheets;
- expandable detail;
- tabs/segmented controls when the information relationship is real;
- split views;
- contextual actions.

The default view should answer the primary question quickly.

## Theme model

The target user preference is:

```text
System
Dark
Light
```

`System` remains the target/preferred user preference default for the fully migrated product. During the incremental legacy UI rollout, absence of a stored preference resolves to `dark` so unmigrated screens remain on the compatibility baseline.

The application shell/root resolves that preference to a rendered light or dark theme. Shared
components remain unaware of the active theme and consume semantic tokens only.

The current dark theme is the compatibility baseline. A future light palette must be designed as a
first-class palette rather than produced by naïvely inverting dark colors.

Light mode should preserve:

- sufficient contrast;
- sports-orange brand recognition;
- clear surface hierarchy;
- readable charts;
- manager/team/statistic meaning;
- restrained elevation.

Domain colors must be checked in both themes. If one raw domain color cannot provide acceptable
contrast in both, expose theme-safe semantic presentation rather than duplicating component logic.

## Application canvas

The application canvas is the visual environment beneath features.

It should provide:

- global background;
- content width rules;
- page gutters;
- vertical rhythm;
- persistent shell clearance;
- optional restrained ambient treatment.

The canvas must make it possible for meaningful content to sit directly on the page without requiring
a Card wrapper.

A migrated page may therefore combine open and contained regions:

```text
Page header / context
──────────────────────────────

Open focal analytics region

──────────────────────────────

Card        Card

──────────────────────────────

Full-width chart or table

──────────────────────────────

Activity rail / list
```

The design system should not force a uniform widget grid.

## Presentation patterns

These are product patterns, not an instruction to create a React component for every name.

### Focal / hero region

Use for the page's primary question or object:

- selected player;
- manager season status;
- next matchup;
- prediction workflow state;
- league leader.

A focal region may use large typography, identity imagery, a key metric and one primary action without
necessarily being a Card.

### Card

Use when content benefits from clear bounded grouping, independent interaction or repeated placement.

Good examples:

- compact metric group;
- prediction category;
- small analytical module;
- contained action panel.

Avoid wrapping an already self-contained table, section and chart in nested Cards merely for visual
consistency.

### Open analytical section

Charts, narrative insights and major comparison sections may sit directly on the canvas using spacing,
section headings and separators rather than another surrounding Card.

### Data rail

Horizontal or compact sequential content for:

- key metrics;
- trending players;
- upcoming matches;
- recent transfers;
- compact live activity.

On phone, rails may support horizontal scrolling when discoverability and touch behavior remain clear.

### Full-width data region

Complex rankings and comparative tables often deserve the full content width instead of being
constrained by a dashboard tile.

Desktop may use dense tabular presentation; phone may use an equivalent list/detail composition.

### Split view

Desktop analytical workflows may combine:

```text
list / ranking / filters | selected entity detail
```

Use when keeping context visible materially improves comparison or exploration.

Do not force the same split layout onto narrow phone screens.

### Context drawer / bottom sheet

Use for secondary information that should not interrupt the current analytical flow.

Desktop may use a drawer or contextual panel. Phone should normally prefer a bottom sheet/full-height
sheet when the interaction needs more room.

### Narrative insight

Analytics may pair a metric or chart with concise explanatory copy, for example why a trend matters or
what changed across recent rounds.

Narrative text must be supported by the underlying data; it is not decorative filler.

## Desktop experience

Desktop should behave like an analytical workspace.

Prefer:

- persistent but quiet navigation;
- clear page/context header;
- high information density where comparison benefits;
- full-width tables and charts when appropriate;
- split views for exploratory workflows;
- persistent or nearby filters;
- fewer unnecessary stacked Cards;
- more whitespace around primary analytical regions.

Desktop may show multiple related views simultaneously when that improves comparison.

## Mobile experience

Phone UI should behave like a focused sports application, not a squeezed desktop dashboard.

Prefer:

- compact sticky context/header where useful;
- strong focal information near the top;
- concise metric rails;
- focused charts;
- readable ranking/activity lists;
- progressive detail;
- bottom navigation;
- bottom sheets for selection and secondary detail;
- comfortable touch targets and PWA safe-area support.

Do not remove important information simply because the desktop table does not fit. Recompose it.

Desktop and phone should share the same domain view model whenever practical while being free to use
different presentation components when information priority or interaction genuinely changes.

## Page archetypes

Use these as composition guidance, not rigid templates.

### Overview / dashboard

Purpose: scan the current state quickly.

Possible structure:

```text
Context / season header
Focal current-state region
Key metric rail
Primary trend / activity
Secondary modules
Full-width recent data
```

### Entity profile

Purpose: understand one player, manager or team.

Possible structure:

```text
Identity / hero
Core metrics
Form / evolution
Contextual comparison
History / matches / market
Secondary detail
```

### Analytics workspace

Purpose: compare and investigate.

Possible structure:

```text
Context + filters
Primary full-width visualization
Split comparison or ranking
Detailed table
Context drawer/detail
```

### Selection / prediction workflow

Purpose: make a series of deliberate choices.

Possible structure:

```text
Workflow context / deadline / progress
Focal category
Selection controls
Completed choices / summary
Secondary league context
Save/validation state
```

Season Predictions should be the first new page used to validate this direction.

## Motion

Motion should clarify state, hierarchy or spatial relationships.

Good uses:

- opening/closing sheets and dialogs;
- selected item transitions;
- reordering;
- expanding detail;
- navigation feedback;
- meaningful number changes where restrained.

Avoid:

- automatic entrance animation on every Card;
- hover lift on every surface;
- permanent glowing motion;
- animation that slows repeated analytical actions.

All motion must respect reduced-motion preferences.

## Designing for future visual evolution

Architecture should make redesign cheaper.

### Keep data independent from layout

Services and view models provide data meaning. They must not encode whether information appears in a
Card, rail, split view or full-width table.

### Keep feature semantics independent from shared styling

A `PlayerSelector` may understand players; it should compose generic UI rather than own global colors,
radii or overlay behavior.

### Prefer composition to page templates

Do not create one universal dashboard template that every feature must fit.

Screens compose sections appropriate to the domain using a small shared vocabulary.

### Avoid page-specific design tokens

Do not add tokens such as `--dashboard-card-blue` or `--predictions-background` to the global design
foundation.

Feature-specific visual meaning stays feature-owned unless repeated use demonstrates a product-level
semantic role.

### Allow replacement without data migration

A future design should be able to replace:

```text
Card grid → open analytical layout
table → split view
popover → drawer
```

without rewriting services, queries or domain models.

This is one reason the UI migration must remain aligned with the separate application/domain
architecture migration.

## Visual migration policy

There are now two valid UI migration modes.

### Structural compatibility slice

Used when moving existing UI ownership/architecture without redesign.

Requirements:

- preserve appearance and interaction;
- protect existing visual baselines;
- do not use architectural migration as an excuse for redesign.

### Explicit design-evolution slice

Used when the task explicitly approves a new visual direction.

Requirements:

- preserve domain behavior/data/access contracts;
- define desktop and mobile targets;
- test light and dark themes once theme support exists;
- update reviewed visual baselines intentionally;
- document meaningful product-design changes.

Do not silently mix the two modes in one unrelated refactor.

## Near-term migration sequence

The current intended sequence is:

```text
UI-00   architecture + design-token extraction         complete
UI-01A  Surface + composable Card foundation           complete

DESIGN DIRECTION CHECKPOINT                             this specification

UI-01T theme-ready token/runtime work                  implemented foundation capability
UI-01B core primitives                                 implemented foundation capability
UI-01H rollout hardening                               dark compatibility default for legacy UI
UI-SHELL application shell/chrome migration            first production adoption
UI-01C shared compositions                             extract from demonstrated shell/page needs
UI-02  interactive controls                            selectors, overlays and related behavior
UI-03  Season Predictions pilot                       first new-page design validation
UI-04  foundation/design review                       refine before broad adoption

Later:
feature-by-feature legacy page migration
```

Exact task ordering may change when a demonstrated dependency justifies it, but new primitives must be
theme-ready and must not assume that every page is a Card grid.

## Acceptance for new UI work

A new or redesigned UI slice should answer:

- What is the primary user question?
- Which information deserves focal hierarchy?
- Why is each bounded surface a Card?
- Can any region live directly on the canvas?
- What changes between desktop and phone, and why?
- Does the component consume semantic tokens rather than theme-specific values?
- Will the layout remain valid in both dark and light modes?
- Are states, keyboard behavior, touch targets and reduced motion covered?
- Can the same feature data support a different layout later without changing its domain service?
