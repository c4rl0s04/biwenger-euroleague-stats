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

### UI-01T implementation contract

`useTheme` in `src/contexts/ThemeContext.tsx` exposes `theme: ThemePreference`,
`resolvedTheme: ResolvedTheme` and `setTheme(preference)`. The types are exported from that module.
The independent `showSnow` / `toggleSnow` contract and `showSnow` storage key remain supported.
Legacy `CardThemeContext`, Card variants and their old ThemeSwitcher are separate and unchanged.

The application reuses localStorage key `theme`. Valid preferences are `system`, `dark` and `light`;
missing, invalid and historical Card-style values fall back to `system`. Selecting a preference
persists that preference, so OS changes never turn stored `system` into `dark` or `light`.
Storage failures leave the current page usable. Other-tab storage changes are observed.

The canonical resolved marker is `html[data-theme="dark" | "light"]`. Matching `.dark` / `.light`
classes are maintained only for the existing map observer. The same resolver sets CSS `color-scheme`
and prepends its own unconditional `meta#application-theme-color` as the first chrome-color choice.
Root layout's two media-qualified `theme-color` tags remain untouched as the no-JavaScript fallback.
This ownership split prevents React from duplicating a hoisted meta tag whose content was changed
before hydration. Viewport sizing and PWA install/offline contracts remain unchanged. The installed
manifest/splash colors remain static and are not a runtime theme selector.

On full loads, a small static script in `<head>` reads the preference and resolves the OS before body
paint. It contains no user-generated script source. Only the intentionally adjusted HTML root
suppresses hydration warnings. The provider always renders children on the server, and
`useSyncExternalStore` supplies the same `system` / `light` snapshot during SSR and hydration before
subscribing to the browser snapshot. That snapshot is not the visual default: semantic CSS and the
head script own first-paint colors. Future controls must use semantic styling and must not hide the
application or select component palettes based on this hydration snapshot.

Without JavaScript, the root has no theme marker and CSS follows `prefers-color-scheme`; stored local
preferences cannot be read in that case. The shared root retains the exact dark mappings, shape and
legacy aliases. Explicit light and the no-marker/light-OS fallback use identical light mappings,
with a test preventing drift between the two CSS blocks. Light uses paper/ink surfaces, deeper orange
and destructive red, stronger control borders and quiet effects. Surface and composable Card require
no theme props or implementation changes. No dependency or production showcase route is added.

Light-mode readiness is incremental: hard-coded white/slate text, manager gradients, legacy Card
borders, chart/domain colors, shell shadows and static PWA splash colors still need their owning UI
slices. The new Card/Surface contain no domain colors. Their primary and muted content, focus and
destructive semantics are checked against both palettes. Dark orange with white small action text
remains a pre-existing contrast limitation; UI-01B must explicitly resolve the action-foreground
contract when introducing Buttons rather than copying that legacy combination.

Benefits:

- shared components remain theme-agnostic;
- changing a palette does not require rewriting component markup;
- dark and light modes can evolve while preserving one product identity;
- future themes can be evaluated by remapping semantics rather than cloning UI;
- feature layouts remain independent from color-theme selection.

Costs and follow-up:

- both raw palettes and their semantic mappings must be maintained;
- chart, domain and status colors need contrast review in both themes;
- theme preference persistence and first-render behavior require dedicated regression testing;
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
