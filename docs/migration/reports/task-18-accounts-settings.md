---
title: Task 18 — Accounts and settings migration receipt
description: Authoritative implementation receipt for account mutations, credentials encryption boundary, settings screens, and safe read services.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 18: Accounts and settings migration receipt

**Task status:** Implemented & Verified  
**Date:** 2026-09-26  
**Branch:** `refactor/accounts-settings`

---

## 1. Summary of Changes

Task 18 encapsulates user account operations, credential encryption integration, password mutations, and settings presentation into the dedicated feature namespace `src/features/accounts/`:

1. **Password Mutation:** `POST /api/user/change-password` -> `accountCommandService.changePassword` (validates via Zod schema, verifies current password with bcrypt, hashes new password with cost factor 10, updates DB via `accountRepository`).
2. **Biwenger Linking Mutation:** `POST /api/user/link-biwenger` -> `accountCommandService.linkBiwenger` (authenticates directly with Biwenger API, delegates token encryption to `biwengerCredentials.storeCredential` using AES-256-GCM, stores token in database, ensures zero token exposure in errors/logs).
3. **Settings Read Service:** `accountReadService.getAccountSettings` (retrieves account settings and user profile with safe fallbacks, returning serializable `AccountSettingsViewModel`).
4. **Settings Screens Migration:** Relocated `DesktopSettingsScreen`, `MobileSettingsScreen`, and `MobileSettingsDetail` to `src/features/accounts/screens/`, exporting via client-safe `public.ts`.
5. **Backwards-Compatible Route & Component Adapters:**
   - `src/components/settings/DesktopSettingsScreen.js` re-exports from `@/features/accounts/public`.
   - `src/components/mobile/screens/MobileSettingsScreen.tsx` re-exports from `@/features/accounts/public`.
   - `src/components/mobile/screens/MobileSettingsDetail.tsx` re-exports from `@/features/accounts/public`.
   - `src/app/(app)/settings/page.tsx` and `src/app/(app)/settings/[section]/page.tsx` consume screens from `@/features/accounts/public`.
   - `src/app/api/user/change-password/route.ts` and `src/app/api/user/link-biwenger/route.ts` consume `accountCommandService` from `@/features/accounts/server`.

---

## 2. Architectural Boundaries & Security Guarantees

- **Encrypted Credential Boundary:** Delegated directly to `biwengerCredentials.storeCredential`. No plaintext fallbacks exist. Credentials are encrypted using AES-256-GCM with environment keyrings.
- **Zero Token Leakage:** Biwenger API response tokens are consumed in memory solely to pass into `storeCredential`. Errors from Biwenger authentication or database updates sanitize error messages and strip tokens, authorization headers, and raw network payloads.
- **Fail-Closed Mutation Policy:** Password changes and account linking are strictly non-idempotent and fail closed. Any failure at validation, authentication, hashing, or persistence stops immediately with clean error envelopes.
- **Strict Input Validation:** Payloads are validated via `ChangePasswordInputSchema` and `LinkBiwengerInputSchema` in `src/features/accounts/validation/account-command.schema.ts`.
- **Client/Server Isolation:** Server commands, services, and repositories are in `server.ts` guarded by `import 'server-only'`. Client-safe validation schemas, view models, and presentation screens are re-exported via `src/features/accounts/public.ts`.
- **Database Encapsulation:** Drizzle ORM queries are encapsulated in `accountRepository.ts`. Presentation components and Route Handlers never access database tables directly.

---

## 3. Verification Evidence

- **Validation Schemas:** `src/features/accounts/__tests__/account-command.schema.test.ts` (9/9 passed).
- **Command Service:** `src/features/accounts/__tests__/account-command.service.test.ts` (12/12 passed).
- **Read Service:** `src/features/accounts/__tests__/account-read.service.test.ts` (2/2 passed).
- **Route Contracts:** `src/app/api/user/__tests__/user-routes.test.ts` (7/7 passed).
- **Architecture Integrity:** `npm run architecture:check` passed cleanly with 0 violations across 88 entrypoints and 1,059 modules.
- **Type Safety:** `npm run typecheck` passed with 0 errors.
- **Lint:** `npm run lint` passed with 0 errors (24 legacy img warnings).
- **Database Schema & Drift Audits:** `npx drizzle-kit check` and `npm run db:audit:schema:metadata` passed (37 tables, 0 drift).
- **Production Build:** `npm run build` compiled successfully, generating 52/52 static pages.
- **Full Test Suite:** `npm run test:run -- --maxWorkers=2` passed (330 test files, 2,720 tests passed, 0 failures, 2 skipped).
