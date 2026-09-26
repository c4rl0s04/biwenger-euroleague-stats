---
title: Task 15 Lineup commands
description: Domain feature boundary for lineup mutations, strict Zod input validation, fail-closed provider command execution, unfrozen route handlers, and backward-compatible shims.
audience:
  - maintainer
  - agent
status: active
---

# Task 15 — Lineup commands

Base: `726061be` (`main`).
Branch: `refactor/lineup-commands`.
Worktree: `../biwengerstats-next-lineup-commands`.
State: Integrated into main at `098bb0c9`.

## Scope and purpose

Task 15 completes the lineup feature boundary by migrating mutating lineup operations (saving formations, updating starters, bench, captain, and striker) into `src/features/lineup/`.

Prior to this task, lineup writes were handled through `src/lib/services/lineupService.ts` and `POST /api/users/lineup`, which was frozen under a SHA-256 lock in `src/features/schedule/boundary.test.ts` until Task 15.

### Key architectural invariants implemented

1. **Feature Command Orchestration (`src/features/lineup/`)**:
   - `src/features/lineup/server/services/lineup-command.service.ts`: Marked with `import 'server-only'`, exposing `lineupCommandService.updateLineup(userId, input)`.
   - `src/features/lineup/server.ts`: Exports `lineupCommandService`, `LineupCommandService`, `validateLineupCommand`, and `LineupValidationError`.
   - `src/features/lineup/public.ts`: Exports client-safe interfaces `LineupCommandInput` and `LineupCommandResult`.

2. **Defense at System Edge (Zod Validation)**:
   - `src/features/lineup/validation/lineup-command.schema.ts`: Validates `type` (formation string), `playersID` (non-empty array of valid identifiers), `reservesID`, `captain`, `striker`, and `coach`.
   - Malformed payloads are rejected immediately with a 400 Bad Request before token decryption or network dispatch.

3. **Provider Boundary Integration & Fail-Closed Policy**:
   - Submissions route through `executeUserProviderCommand(userId, 'lineup.update', ...)` from `@/features/provider/server`.
   - Enforces a strict **zero-retry, fail-closed** mutation policy on rate limits and network errors, preventing duplicate mutations or squad corruption.
   - Upstream error messages are sanitized to guarantee zero token or credential leakage.

4. **Unfreezing Route Handler (`/api/users/lineup`)**:
   - `src/app/api/users/lineup/route.ts` is officially unfrozen and updated:
     - `GET`: Authenticates session and delegates to `lineupReadService.getLineup(session.user.id)`.
     - `POST`: Authenticates session, validates input schema, and delegates to `lineupCommandService.updateLineup(session.user.id, body.lineup)`.
     - Preserves response envelopes (`mutationSuccessResponse` and `privateJsonResponse`) and `Cache-Control: private, no-store`.
   - `src/features/schedule/boundary.test.ts` is updated to retire the route freeze while maintaining contract verification on schedule callers (`AutoAlignButton.js`, `LineupModal.js`, `api-client.js`).

5. **Backward Compatibility & Caller Contracts**:
   - `src/lib/services/lineupService.ts` is retained as an adapter, delegating to `lineupCommandService` and `lineupReadService`.
   - Client components (`AutoAlignButton.js`, `LineupModal.js`, `LineupClient.js`, `MobileLineupClient.tsx`) and `apiClient.saveLineup` continue functioning without changes.

---

## Files created and modified

### Created in `src/features/lineup/`

- `src/features/lineup/validation/lineup-command.schema.ts`: Zod validation schemas for lineup commands.
- `src/features/lineup/server/services/lineup-command.service.ts`: Command service orchestrating mutations.
- `src/features/lineup/server/__tests__/lineup-command.service.test.ts`: Unit tests verifying mutation execution, schema validation, fail-closed policy, and canary token redaction.

### Modified

- `src/features/lineup/models/lineup.ts`: Added `LineupCommandInput` and `LineupCommandResult`.
- `src/features/lineup/server.ts`: Exported command service, schemas, and types with `server-only` isolation.
- `src/features/lineup/public.ts`: Exported client-safe command types.
- `src/features/lineup/server/__tests__/boundary.test.ts`: Updated boundary contracts for command exports.
- `src/app/api/users/lineup/route.ts`: Unfrozen and connected to feature services.
- `src/features/schedule/boundary.test.ts`: Retired route hash lock while preserving schedule callers.
- `src/app/api/user/__tests__/user-routes.test.ts`: Updated to verify route contracts with feature-owned services.
- `src/lib/services/lineupService.ts`: Maintained backward-compatible facade.
- `docs/migration/tracker.md`: Advanced Task 15 to verified state.
