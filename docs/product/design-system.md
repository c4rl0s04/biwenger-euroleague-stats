---
title: Product design context
description: Visual authority and interaction expectations for the analytics application.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Product design context

Biwenger Stats is a Spanish-language EuroLeague fantasy analytics application. Its core work is
scanning results, comparing players and teams, following league activity, and managing fantasy decisions.
Data legibility and consistent navigation take precedence over decorative novelty.

## Existing visual authority

[Global CSS](../../src/app/globals.css) owns the current tokens: dark black/slate surfaces, sports
orange primary (`#fa5001`), muted secondary text, borders, radii, and restrained glow/glass effects.
Tailwind v4 maps the CSS custom properties through `@theme inline`; do not introduce a second theme
configuration. Typography uses Outfit for the primary sans family, Bebas Neue for display, and
Inter for UI where configured. Check the actual component for local choices before normalizing them.

Use semantic utilities (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`)
and existing token variables. Team, manager, and statistic colors carry domain meaning; preserve
those mappings rather than treating every color as brand decoration.

## Representative surfaces

- [Team Profile](../../src/features/teams/components/TeamProfileScreen.tsx): shared view model with
  separate desktop/mobile composition, roster and match context.
- [Matches](../../src/features/matches/components/MatchesScreen.tsx): schedule and round browsing.
- [Mobile home](../../src/components/mobile/screens/MobileHomeScreen.tsx): activity-led cover with
  filters and account/search sheets.
- [App shell](../../src/components/layout/AppShell.js): inspect its active presentation and navigation
  conventions before adding routes or actions.

## Behavior to preserve

Desktop may favor comparative tables and simultaneous panels; phone layouts prioritize readable
rows and focused sections. Both preserve the information available in the domain view model.
Use existing responsive presentation helpers instead of inventing competing breakpoint logic.

Keep numeric formatting, currency, units, score meaning, chart series colors, and legend labels
consistent with their domain. Dense data should remain readable; do not hide essential columns
without providing an equivalent mobile view. Pair color cues with labels or other readable cues.

Respect installed-PWA safe areas and header/bottom-navigation clearance. Interactive controls need
keyboard access, visible focus, useful accessible names, and appropriate touch area. Sheets must
support dismissal and restore focus. Motion should explain changes and respect reduced-motion users.

Loading, empty, not-found, error, long-name and narrow-viewport states are part of each screen.
Use [browser verification](../contributing/testing.md) to inspect these states. Structural architecture
work preserves appearance; intentional redesign updates this document and reviewed visual baselines.
