---
title: Task 20 — Assistant Migration Receipt
description: Authoritative implementation receipt for AI Assistant conversational analytics, context construction, conversation persistence, provider boundaries, and screens.
audience:
  - maintainer
  - contributor
  - agent
status: active
---

# Task 20: Assistant Migration Receipt

**Task status:** Implemented & Verified  
**Date:** 2026-09-27  
**Branch:** `refactor/assistant`

---

## 1. Summary of Changes

Task 20 establishes the dedicated feature namespace `src/features/assistant/`, encapsulating conversation persistence, context assembly, third-party provider boundaries (Groq / OpenAI), and client chat presentation:

1. **Feature Architecture:**
   - `src/features/assistant/constants/assistant-instructions.ts`: System prompt instructions, provider models, Groq base URL, context length limits, starter prompts, and NLP stop words.
   - `src/features/assistant/models/assistant.models.ts`: Plain, typed, serializable view models (`AssistantRole`, `AssistantConversation`, `AssistantMessage`, `AssistantContextBlock`, `AssistantContextRequest`, `AssistantDebugPayload`, `AssistantChatResponse`, `AssistantConversationsResponse`, `AssistantConversationDetailResponse`).
   - `src/features/assistant/validation/assistant.schema.ts`: Zod validation schemas (`ChatRequestSchema`, `CreateConversationSchema`, `ConversationIdParamSchema`) and typed `AssistantValidationError`.
   - `src/features/assistant/server/repositories/assistant.repository.ts`: Encapsulated Drizzle ORM operations for `assistantConversations` and `assistantMessages`, enforcing `userId` ownership on queries and cascades.
   - `src/features/assistant/server/services/assistant-provider.service.ts`: Encapsulates OpenAI SDK client instantiation for both Groq and OpenAI backends, error mapping (429 quota exhaustion, 503 missing credentials, 502 empty response).
   - `src/features/assistant/server/services/assistant-player-context.service.ts`: Natural language player search extraction and player context formatting using `@/features/players/server` and `@/features/search/server`.
   - `src/features/assistant/server/services/assistant-context.service.ts`: Cross-domain context assembly across 8 intents (`players`, `my_team`, `market`, `standings`, `rounds`, `compare`, `predictions`, `lineup_recommendation`), with strict sensitive data redaction.
   - `src/features/assistant/server/services/assistant-command.service.ts`: Mutations (`createConversation`, `deleteConversation`, `sendMessage`).
   - `src/features/assistant/server/services/assistant-read.service.ts`: Queries (`listConversations`, `getConversation`).
   - `src/features/assistant/screens/`: `DesktopAssistantScreen.tsx` and `MobileAssistantScreen.tsx`.
   - `src/features/assistant/components/AssistantChat.js`: Relocated client interactive chat interface.
   - `src/features/assistant/public.ts` & `src/features/assistant/server.ts`: Client-safe barrel and server-only entrypoint protected with `import 'server-only'`.

2. **Routes & Pages Refactored:**
   - `src/app/(app)/assistant/page.js`: Thin adapter composing desktop and mobile screens from `@/features/assistant/public`.
   - `src/app/(app)/assistant/[conversationId]/page.tsx`: Thin adapter composing `MobileAssistantScreen` from `@/features/assistant/public`.
   - `src/app/api/assistant/route.ts`: Thin Route Handler delegating to `assistantCommandService.sendMessage`.
   - `src/app/api/assistant/conversations/route.ts`: Thin Route Handler delegating `GET` to `assistantReadService.listConversations` and `POST` to `assistantCommandService.createConversation`.
   - `src/app/api/assistant/conversations/[id]/route.ts`: Thin Route Handler delegating `GET` to `assistantReadService.getConversation` and `DELETE` to `assistantCommandService.deleteConversation`.

3. **Backwards-Compatible Adapters:**
   - `src/lib/services/features/assistantService.ts`: Re-exports delegating to feature server services/repository.
   - `src/lib/services/features/assistantContextService.ts`: Re-exports from `@/features/assistant/server`.
   - `src/lib/services/features/assistantPlayerContextService.ts`: Re-exports from `@/features/assistant/server`.
   - `src/components/assistant/AssistantChat.js`: Re-exports from `@/features/assistant/public`.
   - `src/components/mobile/screens/MobileAssistantScreen.tsx`: Re-exports from `@/features/assistant/public`.

4. **Architecture Policy:**
   - Registered 5 assistant entrypoints in `scripts/architecture/policy.json` with explicit `auth()` exception declarations and documented `legacy-service` exception for read-only cross-domain context aggregation.

---

## 2. Architectural Boundaries & Security Guarantees

- **Session Authentication & Ownership Enforcement:** Every assistant Route Handler enforces session authentication via `auth()`, returns HTTP 401 for unauthenticated calls, and guarantees users can only read, message, or delete conversations they own.
- **Cache-Control Private No-Store:** All assistant API responses return `Cache-Control: private, no-store`.
- **Secret Isolation & Zero Token Leakage:** Provider API keys (`GROQ_API_KEY`, `OPENAI_API_KEY`) remain strictly on the server. Data redaction filters out emails, tokens, and authorization headers before context is sent to the LLM.
- **Fail-Closed Provider Resilience:** AI provider errors (quota exhaustion, invalid provider configuration, missing keys) fail gracefully with structured error envelopes without crashing the application.
- **Layer Isolation:** Direct Drizzle ORM queries are encapsulated in `assistantRepository.ts`. Presentation components and Route Handlers receive only serializable view models.

---

## 3. Verification Evidence

- **Unit Tests:**
  - `src/features/assistant/__tests__/assistant.schema.test.ts`: 9 passed.
  - `src/features/assistant/__tests__/assistant-read.service.test.ts`: 4 passed.
  - `src/features/assistant/__tests__/assistant-command.service.test.ts`: 8 passed.
  - `src/features/assistant/__tests__/assistant-context.service.test.ts`: 10 passed.
  - `src/lib/services/features/__tests__/assistantContextService.test.ts`: 10 passed.
  - `src/app/api/assistant/__tests__/assistant.test.ts`: 10 passed.
- **Architecture Integrity:** `npm run architecture:check` passed with 0 violations across 99 entrypoints and 1,097 modules; `src/tests/architecture/server-guards.test.ts` passed (144/144 tests).
- **Type Safety:** `npm run typecheck` passed with 0 errors.
- **ESLint:** `npm run lint` passed with 0 errors.
- **Documentation Vault:** `npm run docs:check` passed across 120 notes.
- **Database Schema & Drift Audits:** `npx drizzle-kit check` and `npm run db:audit:schema:metadata` passed (37 tables, 0 drift).
- **Production Build:** `npm run build` compiled successfully (52/52 static pages generated).
- **Full Test Suite:** `npm run test:run -- --maxWorkers=2` passed (336 test files, 2,776 tests passed, 0 failures, 14 skipped).
