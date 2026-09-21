---
title: ADR-0008 Semantic theme preferences
description: Use semantic tokens as the theme boundary and support system, dark, and light user preferences.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# ADR-0008: Semantic theme preferences

- **Status:** accepted
- **Date:** 2026-09-21
- **Supersedes:** none

## Context

Biwenger Stats historically renders one dark visual theme. The UI migration has already separated raw
base values from semantic tokens and introduced new shared primitives on top of those semantics.

The product now needs to support visual evolution, including a first-class light theme, without
creating separate component trees or spreading theme-specific styling across every feature.

The repository also contains legacy theme/card experiments. Carrying those historical variants into the
new foundation would reintroduce multiple visual systems and make later redesign harder.

## Decision

The supported user preference model is:

```text
system | dark | light
```

`system` is the default preference.

The application shell/root is responsible for resolving the preference to the rendered theme and for
making that state available at the document root.

The **semantic token layer is the theme boundary**:

```text
raw/base palettes
       ↓
theme-aware semantic tokens
       ↓
Tailwind semantic bridge
       ↓
shared UI / shell / feature UI
```

Shared components consume semantic roles such as surfaces, content, borders, actions and statuses.
They must not contain independent dark/light palettes or select a visual theme themselves.

The current dark values remain the initial compatibility baseline. Light mode is designed as a
first-class semantic mapping with its own raw palette where necessary.

Component-level Tailwind `dark:` branches should not become the normal theming mechanism. A local
exception requires a concrete visual behavior that cannot be represented by a semantic token and should
be reviewed before use.

The system does not reintroduce legacy Card themes such as glass, mesh or neo. Surface hierarchy
(`default`, `raised`, `subtle`) is independent from the user color theme.

Domain colors for teams, managers and statistics remain domain semantics. Their presentation must be
checked for contrast in both light and dark contexts.

The theme implementation must set the appropriate browser `color-scheme` and avoid an avoidable
incorrect-theme flash during initial rendering. Exact persistence/hydration mechanics are an
implementation concern constrained by this decision.

## Consequences

Benefits:

- shared components remain theme-agnostic;
- changing a palette does not require rewriting component markup;
- dark and light modes can evolve while preserving one product identity;
- future themes can be evaluated by remapping semantics rather than cloning UI;
- feature layouts remain independent from color-theme selection.

Costs and follow-up:

- a light raw palette and semantic mapping must be designed;
- chart, domain and status colors need contrast review in both themes;
- theme preference persistence and first-render behavior require dedicated implementation/testing;
- visual regression coverage should eventually include representative dark and light states;
- legacy hard-coded colors can only be retired incrementally as their owning UI slices migrate.

## Alternatives considered

### Remain dark-only

Rejected because it constrains user preference and makes the current dark implementation an accidental
architectural assumption.

### Use component-local `dark:` styling everywhere

Rejected because theme knowledge would be duplicated across components and visual redesign would become
a repository-wide component edit.

### Maintain separate dark and light component trees

Rejected because it duplicates behavior and creates long-term divergence risk.

### Restore historical Card themes as the theme system

Rejected because those variants represent component styling experiments, not coherent application-wide
user color themes.
