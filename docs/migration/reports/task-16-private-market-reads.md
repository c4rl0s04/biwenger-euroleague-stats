---
title: Task 16 — Private Market reads audit receipt
description: Authoritative audit evidence establishing absence of standalone private market reads and canonical ownership under lineup.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 16: Private Market reads audit receipt

**Task status:** Verified / Completed (Proven No-Op Read Slice)  
**Date:** 2026-09-26  
**Reconciliation against:** `main` (commit `6db446fd`)

---

## 1. Context and Objective

In accordance with [`docs/migration/tracker.md`](../tracker.md):

> _"Task 16 — Private Market reads_  
> _Scope: Migrate only private account/offer reads confirmed in source; exclude public analytics and mutations._  
> _Completion check: Private typed models isolated from public cache/contracts._  
> _Evidence: Public slice already merged in PR 38._  
> _Next action: Inventory actual operations; document no-op only if absence is proven."_

This receipt records the exhaustive source audit and architectural evidence establishing that **no standalone private market read endpoints or services exist** in the repository.

---

## 2. Audit Evidence & System Boundary Trace

### A. All Market HTTP GET Endpoints are Public Read Models

Every `GET` route under `/api/market/` queries PostgreSQL analytics and public catalogue data without requiring authentication, user sessions, or decrypted provider credentials:

- `GET /api/market`: Calls `getMarketPageData()` (`features/market/server`) -> Public catalogue, listings, and summary KPIs.
- `GET /api/market/stats`: Calls `fetchMarketStats()` (`features/market/server`) -> League-wide market KPIs.
- `GET /api/market/stats/value-details`: Calls `getBestValueDetails()` (`features/market/server`) -> Historical player value trajectories.
- `GET /api/market/trends`: Calls `getMarketTrendsAnalysis()` (`features/market/server`) -> Revaluation and devaluation statistics.
- `GET /api/market/transfers`: Calls `getLiveMarketTransfers()` (`features/market/server`) -> Public transfer log.
- `GET /api/market/duels/details`: Calls `getBiddingDuelDetails()` (`features/market/server`) -> Multi-manager bidding analytics.

All of these were migrated to `src/features/market/` in PR #38 and modularized into sub-namespaces (`analytics/`, `catalogue/`, `trends/`, `screens/`) in PR #48.

### B. User-Specific Market Data Is Exclusively Owned by Lineup Domain

In the Biwenger API protocol, an authenticated user's private market listings and incoming transfer offers are not fetched via `/market` or `/offers`. Rather, they are returned in the unified user profile payload:

```
GET /user?fields=*,lineup(type,playersID,reservesID,captain,striker,coach,date),players(id,owner),market,offers,-trophies
```

This payload was already migrated and isolated under **Task 14 (Lineup reads)**:

- Service: `lineupReadService.getLineup(userId)` (`src/features/lineup/server/services/lineup-read.service.ts`).
- Secure Transport: `executeUserProviderQuery(userId, 'lineup.read', ...)` with `cache: 'no-store'`.
- Sanitized Models: `SafeMarketListing` and `SafeLineupOffer` in `SafeLineupResponse`.
- Frontend Consumer: `LineupClient.js` calls `GET /api/users/lineup`.

### C. Zero Remaining Private Market Reads

An exhaustive grep of `biwengerFetch`, `biwengerCredentials.withCredential`, and `auth()` across `src/` confirmed that zero orphan private read queries exist. All remaining interactive routes under `/api/market/` are state-mutating commands (handled in Task 17).

---

## 3. Disposition & Closure

Per tracker instructions, Task 16 is formally recorded as a verified no-op read slice. No orphan code or unassigned private market reads remain. Ownership of live user listings and offers remains cleanly encapsulated within `src/features/lineup`.
