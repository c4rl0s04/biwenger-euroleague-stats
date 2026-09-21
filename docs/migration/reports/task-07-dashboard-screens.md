---
title: Task 07 Dashboard screens
description: Dashboard presentation ownership, compatibility evidence and release acceptance.
audience:
  - maintainer
  - agent
status: active
---

# Task 07 — Dashboard screens

Base: `a5a44db0`. Branch: `refactor/dashboard-screen-architecture`.
Worktree: `../biwengerstats-next-dashboard-screen-architecture`.

## Scope and acceptance checklist

- [x] Inspect consumers and establish the focused baseline: 220 tests passed.
- [x] Capture original desktop and phone screenshots; repeat without updating references.
- [x] Move desktop, mobile overview and five section compositions into Dashboard.
- [x] Move cards without changing their request, loading, rendering or interaction behavior.
- [x] Keep pages thin, with typed screen contracts and deliberate feature exports.
- [x] Register both page entrypoints; document exact temporary News/authentication edges.
- [x] Remove obsolete paths after checking all consumers; update tests and documentation.
- [ ] Complete focused/full verification and original-screen browser comparisons.
- [ ] Integrate and publish only after acceptance; preserve unrelated worktrees.

## Compatibility boundaries

The desktop remains independently fetched browser cards. Phone pages retain direct server reads,
existing identity resolution and guarded section routing. Dynamic imports, SSR options, skeletons,
formatting, navigation and currently empty states are compatibility contracts, not redesign targets.

All Dashboard cards are moved, including the inactive IdealLineup, RecentActivity and KpiBento
components. Inactive cards are not added to the rendered screen. Generic UI and shared mobile
primitives remain shared. News retrieval and MobileNewsStrip remain under their existing ownership
until Task 08; this slice does not create a partial News feature. Task 06's HTTP privacy correction
and all existing endpoints remain unchanged.

New screenshot references must originate from unchanged application source at the base commit.
The News headline alone is masked because the existing server feed shuffles randomly. Screenshots
do not hide card data or application failures. Linux Dashboard reference images remain a separate
verification follow-up; supported macOS desktop/iPhone comparisons and all nine semantic projects
are required locally.

No schema, dependency, provider, authentication, credential or environment changes are authorized.
No production database or provider operations are used for validation.

## Implementation evidence

- Three screens live in `src/features/dashboard/screens`. `models/section.ts` is a discriminated,
  serializable section contract over the existing bounded service models. The screens contain no
  authentication, service calls or database reads; the pages remain framework adapters.
- All 22 card/helper modules plus DashboardPlayerRow moved unchanged into `components/cards`;
  their 23 source files are byte-identical to `a5a44db0`. The internal barrel only updates its comment.
  Desktop and phone overview function bodies, and all five section JSX bodies, are AST-equivalent
  to the originals after accounting for the new typed prop names.
- The old component directory, MobileDashboardScreen path and mobile-mapper compatibility adapter
  have no remaining application consumers. The mapper test now resides beside the feature mapper.
  The unused root component barrel no longer re-exports the deleted Dashboard directory.
- `public.ts` exposes client-safe screens and models; the server contract/services and every HTTP
  handler are unchanged. The shared request hook, authentication, styling and dependencies are unchanged.
- Architecture enforcement passes with 980 modules and 82 entrypoints. Each page retains the same
  six exact authentication/credential-infrastructure exceptions as existing protected adapters.
  The overview has exactly two additional News edges: page-to-legacy-feed and feed-to-DB-barrel,
  both explicitly scheduled for removal in Task 08. No checker rules were weakened.
- Focused suite: 251 passing tests, including all 22 original browser request configurations,
  13 dynamic declarations/SSR/loading options, pure screen boundaries and page orchestration/errors.
- Baseline: 220 focused tests and repeated desktop/iPhone production-browser runs passed before
  application edits. Twelve original macOS reference images cover the phone overview/five sections
  and six desktop sections. The final desktop references were refreshed from the unchanged standalone
  build after adding an assertion for the settled €1,500,000 spring animation; no candidate image
  was used as an original reference. News expansion and the REB selector are exercised.
