---
name: project-ui
description: Implement or refine Biwenger Stats product screens using its existing sports analytics identity, shared domain models, and responsive interaction patterns. Use for app UI changes; exclude backend-only refactors and marketing assets.
---

# Biwenger Stats UI

Read [design context](../../../docs/product/design-system.md) and the target screen before editing.
Use the existing tokens and nearby components as the visual source of truth. Preserve the established
identity for refinement; a requested redesign may deliberately change it and must update the context.

Domain screens live in their feature. Only domain-agnostic primitives belong in `src/components/ui`.
Desktop and mobile consume the same view models even when their compositions differ.

For framework questions use [next-best-practices](../next-best-practices/SKILL.md); for keyboard,
focus, and screen-reader work use [accessibility](../accessibility/SKILL.md); for CSS patterns use
[tailwind-css-patterns](../tailwind-css-patterns/SKILL.md). Load only the relevant reference.

Preserve loading, empty, error and not-found states. Check dense tables, long player names, chart
labels, contrast, touch targets, focus return in sheets, safe areas, and reduced motion. Do not add
shadcn, replace chart libraries, generate imagery, or change fonts merely because a generic skill
suggests it.

Use the deterministic browser workflow in [testing](../../../docs/contributing/testing.md).
Inspect desktop and phone together, fix observed issues in a batch, then recheck affected states.
Use screenshot comparisons for existing appearance contracts and semantic assertions for behavior.
Report which routes, sizes, and states were verified and any remaining visual uncertainty.
