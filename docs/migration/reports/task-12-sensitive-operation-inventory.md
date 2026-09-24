---
title: Task 12 Sensitive operation inventory
description: Comprehensive enumeration of database mutations, provider reads and writes, credential boundaries, and scoped approval gates for Tasks 13–21.
audience:
  - maintainer
  - agent
status: active
---

# Task 12 — Sensitive-operation inventory

Base: `0b001b17`.
Branch: `docs/sensitive-operation-inventory`.
Worktree: `../biwengerstats-next-sensitive-operation-inventory`.
State: Verified locally (audit and policy documentation).

## Scope and purpose

Tasks 01 through 11 established feature ownership across all **read-only and analytical domains** (Standings, Tournaments, Predictions, Playoffs, Managers, Schedule, Market public reads, Dashboard, News, Home, Season Review).

**Task 12** is the required **security gate and threat-model audit** before executing Tasks 13 through 21. Unlike previous tasks, Task 12 introduces **no source-code refactoring**. Instead, it performs an exhaustive inspection of:

1. **Third-party provider mutations** (HTTP `POST`, `PUT`, `DELETE` calls to the external Biwenger API).
2. **Private provider reads** (fetching live user-specific squads and lineups via decrypted credentials).
3. **Personal credential lifecycle** (AES-256-GCM encryption at rest, keyring isolation, token retrieval).
4. **Local database state mutations** (user passwords, game records, puzzle guesses, and dual-write side effects).
5. **Route-level authorization and privacy policies** (given that API routes are excluded from the NextAuth proxy).
6. **External AI provider interactions** (data context extraction and prompt transmission).

---

## Sensitive operations matrix

The table below catalogs every sensitive write, credential-consuming read, and state-mutating operation in the repository:

| Operation / Surface                                 | Type                         | Identity & Auth                                                                 | Credential Boundary                                                                                        | Cache & Freshness                            | Retry & Idempotency                                  | Side Effect & Reconciliation                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`POST /api/market/sell`** (mode: `sell`)          | Provider Mutation            | Session required (`session.user.id`). Untrusted body validated.                 | Decrypts personal token via `withCredential(userId, 'market.place')`.                                      | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch` (max 3 retries).      | Places single player on Biwenger market. No local DB write. Reconciled on next routine sync.                                                                                                   |
| **`POST /api/market/sell`** (mode: `immediateSell`) | Provider Mutation + DB Write | Session required (`session.user.id`).                                           | Decrypts personal token via `withCredential(userId, 'market.place')`.                                      | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch`.                      | **Dual-write risk**: Sells on Biwenger, then calls `clearLocalPlayerOwner(playerId)`. If DB fails, error is logged but not rolled back. Reconciled on next sync.                               |
| **`POST /api/market/sell-all`**                     | Provider Mutation            | Session required (`session.user.id`). Validates `pricePercentage`.              | Decrypts personal token via `withCredential(userId, 'market.place-team')`.                                 | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch`.                      | Puts entire squad on Biwenger market (`type: team`). No local DB write. Reconciled on next sync.                                                                                               |
| **`DELETE /api/market/remove`**                     | Provider Mutation            | Session required (`session.user.id`). Validates query param `playerId`.         | Decrypts personal token via `withCredential(userId, 'market.withdraw')`.                                   | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch`.                      | Withdraws listing from Biwenger (`DELETE /market?player=X`). No local DB write. Reconciled on next sync.                                                                                       |
| **`POST /api/market/offers/accept`**                | Provider Mutation + DB Write | Session required (`session.user.id`). Validates `offerId`, optional `playerId`. | Decrypts personal token via `withCredential(userId, 'offer.accept')`.                                      | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch`.                      | **Dual-write risk**: Accepts offer on Biwenger (`PUT /offers/X`). If `playerId` provided, clears local owner in DB. If DB update fails, logged but response succeeds. Reconciled on next sync. |
| **`POST /api/market/offers/reject`**                | Provider Mutation            | Session required (`session.user.id`). Validates `offerId`.                      | Decrypts personal token via `withCredential(userId, 'offer.reject')`.                                      | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch`.                      | Rejects offer on Biwenger (`PUT /offers/X`). No local DB write.                                                                                                                                |
| **`POST /api/users/lineup`**                        | Provider Mutation            | Session required (`session.user.id`). Validates `lineup` object.                | Decrypts personal token via `withCredential(userId, 'lineup.update')`.                                     | No cache (`mutationSuccessResponse`).        | 429 backoff in `biwengerFetch`.                      | Updates active lineup on Biwenger (`PUT /user`). No local DB write. Reconciled on next routine sync.                                                                                           |
| **`GET /api/users/lineup`**                         | Private Provider Read        | Session required (`session.user.id`).                                           | Decrypts personal token via `withCredential(userId, 'lineup.read')`.                                       | `privateJsonResponse` (`private, no-store`). | 429 backoff in `biwengerFetch`.                      | Live fetch of user lineup, squad, and pending market offers. Filtered through `createSafeLineupResponse`.                                                                                      |
| **`POST /api/user/link-biwenger`**                  | Credential Lifecycle         | Session required (`session.user.id`). Validates password/email.                 | Authenticates against Biwenger auth API. Encrypts token with AES-256-GCM into `user_biwenger_credentials`. | `privateJsonResponse` (`private, no-store`). | No retries. Fails closed.                            | Stores encrypted credential ciphertext with authenticated user binding. Plaintext fallback permanently removed.                                                                                |
| **`POST /api/user/change-password`**                | Local DB Mutation            | Session required (`session.user.id`).                                           | Bcrypt verification of `currentPassword`; bcrypt hash (cost 10) of `newPassword`.                          | `privateJsonResponse` (`private, no-store`). | No retries.                                          | Updates `users.password` hash in PostgreSQL.                                                                                                                                                   |
| **`GET /api/hoopgrid/today`**                       | Dynamic DB Mutation in GET   | Optional session.                                                               | None.                                                                                                      | Dynamic, un-cached.                          | None.                                                | **Pattern anomaly**: If no challenge exists for today, executes `hoopgridService.generateDailyChallenge` (inserts challenge into DB) on first GET request. Concurrency race on insert.         |
| **`POST /api/hoopgrid/guess`**                      | Local DB Mutation            | Session required (`session.user.id`).                                           | None.                                                                                                      | `privateJsonResponse` (`private, no-store`). | None.                                                | Inserts record into `hoopgrid_guesses`. Updates challenge cell statistics and computes user rarity.                                                                                            |
| **`POST /api/assistant`**                           | External AI Call + DB Write  | Session required (`session.user.id`). Validates `conversationId` ownership.     | Server-side `GROQ_API_KEY` / `OPENAI_API_KEY` (env secrets).                                               | `privateJsonResponse` (`private, no-store`). | SDK retry defaults. Rate limit 429 maps to HTTP 503. | Extracts user contextual fantasy data and transmits to Groq/OpenAI. Inserts user and assistant messages into `assistant_messages`.                                                             |
| **`POST /api/assistant/conversations`**             | Local DB Mutation            | Session required (`session.user.id`). Validates `firstPrompt`.                  | None.                                                                                                      | `privateJsonResponse` (`private, no-store`). | None.                                                | Inserts new row into `assistant_conversations`.                                                                                                                                                |
| **`DELETE /api/assistant/conversations/[id]`**      | Local DB Mutation            | Session required (`session.user.id`). Verifies conversation ownership.          | None.                                                                                                      | `privateJsonResponse` (`private, no-store`). | None.                                                | Deletes conversation from `assistant_conversations`.                                                                                                                                           |
| **`GET, POST /api/auth/[...nextauth]`**             | Authentication Lifecycle     | Public / Session endpoints.                                                     | Verifies credentials with bcrypt against `users.password`.                                                 | Private session cookie.                      | None.                                                | Issues signed JWT session token with sanitized claims (id, email, biwengerLinked boolean).                                                                                                     |
| **`npm run sync`** (CLI pipeline)                   | Background DB Ingestion      | Ingestion runner / GitHub Actions using global `BIWENGER_TOKEN`.                | Global ingestion token only. Personal user keyring is never loaded.                                        | CLI batch process.                           | 429 backoff in `biwengerFetch`.                      | Writes provider data into 37 PostgreSQL tables. Protected by PostgreSQL advisory locks (`pg_try_advisory_lock`).                                                                               |

---

## Key security findings & operational risks

1. **API Route Proxy Bypass:**
   [`src/proxy.js`](../../../src/proxy.js) explicitly excludes `/api` paths from the NextAuth middleware. Every sensitive Route Handler must independently enforce `const session = await auth(); if (!session?.user?.id) return 401`.
   _Audit confirmation:_ All 12 HTTP mutation routes listed above correctly enforce strict session authentication.
2. **Analytical Read vs. Mutation Identity Resolution:**
   While analytical read routes (`player/stats`, `dashboard/captain-stats`) utilize [`getRequestUserId`](../../../src/lib/utils/api-auth.ts) to permit inspecting public league managers via `?userId=X`, **zero mutation routes** use `getRequestUserId`. All mutation routes strictly bind actions to `session.user.id`.
3. **Dual-Write State Divergence:**
   Both `POST /api/market/sell` (`immediateSell`) and `POST /api/market/offers/accept` modify the external Biwenger provider first, then attempt to update local PostgreSQL ownership (`clearLocalPlayerOwner`). If the database operation fails, the error is caught and logged, but the HTTP response reports completion. This leaves local state temporarily divergent until the next routine ingestion sync.
4. **Retry Behavior on Non-Idempotent Provider Calls:**
   `biwengerFetch` implements automatic retry with exponential backoff on HTTP 429 (`Too Many Requests`). For idempotent reads (`GET`), this is safe. For provider mutations (`POST /market`, `PUT /offers`), if Biwenger partially processed the request before throttling or dropping the connection, retrying could trigger unexpected errors.
5. **State Mutation Inside HTTP GET:**
   `GET /api/hoopgrid/today` triggers challenge generation and database insertion when no challenge exists for the current date. This breaks HTTP GET idempotency and introduces race conditions if multiple users land on Hoopgrid at midnight simultaneously.

---

## Bounded approvals proposed for Tasks 13–21

Based on this inventory, the following boundaries and approval constraints are established for subsequent tasks:

### Task 13 — Provider boundaries

- **Allowed:** Introduce formal typed provider client adapters around `biwengerFetch` and credential services in `src/features/provider/` (or designated feature boundary). Separate read requests from command mutations.
- **Constraints:** Do not modify the underlying credential encryption crypto, keyring configuration, or rotation procedures. Preserve existing error masking (never log or return provider payloads containing auth tokens).

### Tasks 14 & 15 — Lineup reads & commands

- **Task 14 (Reads):** Migrate live lineup retrieval (`lineupService.getLineup`) and `GET /api/users/lineup` into `src/features/lineup/`. Enforce `Cache-Control: private, no-store`. Preserve `createSafeLineupResponse` data masking.
- **Task 15 (Commands):** Migrate `lineupService.updateLineup` and `POST /api/users/lineup`. Validate input schemas with Zod. Ensure no blind retries on unknown network outcomes; return sanitized error messages on failure.

### Tasks 16 & 17 — Market private reads & commands

- **Task 16 (Reads):** Migrate user-specific offer retrieval and private market status. Keep strictly separate from the public market analytics slice already merged in PR #38.
- **Task 17 (Commands):** Migrate `marketActionsService` operations and routes (`sell`, `sell-all`, `remove`, `offers/accept`, `offers/reject`). Ensure explicit user confirmation, sanitize inputs, and document the dual-write reconciliation policy.

### Task 18 — Hoopgrid challenge & gameplay

- **Allowed:** Migrate Hoopgrid service, game generation, and guess submission into `src/features/hoopgrid/`.
- **Constraints:** Address the lazy generation in `GET /api/hoopgrid/today` by isolating challenge generation into an idempotent or transactional service; keep `POST /api/hoopgrid/guess` strictly session-bound.

### Task 19 — Accounts and Settings

- **Allowed:** Migrate `/api/user/link-biwenger`, `/api/user/change-password`, and settings screens into `src/features/accounts/`.
- **Constraints:** **Never restore the removed plaintext fallback** for Biwenger tokens. Maintain strict AES-256-GCM envelope encryption and zero token exposure in client components, sessions, or logs.

### Task 20 — Assistant

- **Allowed:** Migrate `/api/assistant` routes, message persistence, and context providers into `src/features/assistant/`.
- **Constraints:** Maintain strict conversation ownership validation (`userId = session.user.id`). Keep third-party AI provider keys server-only. Ensure user context blocks sent to external AI minimize personal identifiers.

### Task 21 — Offline analysis and simulation CLI

- **Allowed:** Migrate offline scripts (`scripts/analysis/*`) to consume feature engines and queries from `src/features/season-review/server`.
- **Constraints:** Zero web runtime impact. Offline batch scripts must not weaken production database safety or bypass architectural boundaries.
