---
title: Task 17 — Market commands migration receipt
description: Authoritative implementation receipt for market mutations, provider boundaries, and dual-write DB reconciliation.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 17: Market commands migration receipt

**Task status:** Implemented & Verified  
**Date:** 2026-09-26  
**Branch:** `refactor/market-commands`

---

## 1. Summary of Changes

Task 17 migrates all 5 state-mutating market write operations from the legacy `marketActionsService.ts` into the feature-owned namespace `src/features/market/commands/`:

1. **Player Sales:** `POST /api/market/sell` -> `marketCommandService.sellPlayer` (modes: `sell` and `immediateSell`).
2. **Squad Mass Sale:** `POST /api/market/sell-all` -> `marketCommandService.sellAllSquad`.
3. **Withdraw Listing:** `DELETE /api/market/remove` -> `marketCommandService.withdrawPlayer`.
4. **Accept Bid Offer:** `POST /api/market/offers/accept` -> `marketCommandService.acceptOffer`.
5. **Reject Bid Offer:** `POST /api/market/offers/reject` -> `marketCommandService.rejectOffer`.

---

## 2. Architectural Boundaries & Security Guarantees

- **Provider Boundary:** Mutations execute via `executeUserProviderCommand` from `@/features/provider/server`.
- **Fail-Closed Retry Policy:** Zero automatic retries on mutation failure or rate limits (preventing accidental duplicate sales or bids).
- **Zod Schema Validation:** All input payloads are coerced and validated using strict Zod schemas before decrypting credentials or invoking the external provider.
- **Dual-Write Reconciliation:**
  - For `immediateSell` and `acceptOffer` (with `playerId`), the command clears local player ownership in PostgreSQL (`playerSeasons.ownerId = null`) via `marketCommandRepository.clearLocalPlayerOwner(playerId)`.
  - If the database write fails after the Biwenger mutation succeeded, the error is caught and logged, returning a completed response to the client. Local state reconciles on the next routine ingestion sync, avoiding false-failure reports to the user.
- **Zero Credential Leakage:** All error responses sanitize error messages and strip headers, tokens, and authorization payloads.
- **Client/Server Isolation:** Server commands and repositories are tagged with `import 'server-only'`. Client-safe validation schemas and typed results are re-exported via `src/features/market/public.ts`.

---

## 3. Verification Evidence

- **Validation Schemas:** `src/features/market/commands/__tests__/market-command.schema.test.ts` (15/15 passed).
- **Service & Dual-Write:** `src/features/market/commands/__tests__/market-command.service.test.ts` (13/13 passed).
- **Route Contracts:** `src/app/api/market/__tests__/market-actions.test.ts` (4/4 passed).
- **Credential Adoption:** `src/lib/services/credential-boundary.test.ts` (2/2 passed).
- **Zero Architecture Violations:** `npm run architecture:check` passed cleanly across all 88 entrypoints.
