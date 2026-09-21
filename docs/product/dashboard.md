---
title: Dashboard
description: Home and dashboard behavior, data sources, and implementation map.
audience:
  - user
  - contributor
  - maintainer
  - agent
status: active
---

# Dashboard

## Purpose and routes

`/` is the product landing view after authentication. It presents league context and navigation.
`/dashboard` is the personalized command center for the current manager.

The dashboard combines independent cards for upcoming rounds, captain history and suggestions,
leader gaps, recent activity, home/away performance, birthdays, MVPs, form, squad
risers, top players, and market opportunities. Cards can load independently so one failed analytic
does not need to block the entire page.

## Implementation map

- Pages: [`src/app/(app)/page.js`](<../../src/app/(app)/page.js>) and
  [`src/app/(app)/dashboard/page.tsx`](<../../src/app/(app)/dashboard/page.tsx>).
- UI: [`src/components/home`](../../src/components/home) and
  [`Dashboard screens`](../../src/features/dashboard/screens) and feature-owned cards.
- Dashboard data: [`server.ts`](../../src/features/dashboard/server.ts); legacy
  [`dashboardService.ts`](../../src/lib/services/app/dashboardService.ts) remains a compatibility facade
  for consumers assigned to later tasks. News/Home services are still separately pending.
- HTTP: [`src/app/api/dashboard`](../../src/app/api/dashboard) plus `/api/landing-stats`.
- Tests: [`dashboard.test.ts`](../../src/app/api/dashboard/__tests__/dashboard.test.ts) and related
  service/query utility tests.

## Data flow and constraints

The App Router page renders layout and card composition. Most cards obtain personalized data from a
dedicated `/api/dashboard/*` route using the shared client-fetching pattern. Responses depend on a
valid manager identity, synchronized rounds, lineups, player statistics, and market history.

Metrics based on the latest completed round or the next scheduled round can legitimately be empty
at season boundaries. Product copy and loading states should distinguish unavailable source data
from transport errors.

The thin Dashboard pages select presentation, resolve identity and call existing services for phone
views. Desktop widgets retain their independent browser requests, loading placeholders and dynamic
imports. IdealLineup, RecentActivity and KpiBento implementations remain feature-owned but inactive;
their presence does not imply they are rendered. Current error-to-empty fallbacks are preserved,
not redesigned by the architectural migration.
