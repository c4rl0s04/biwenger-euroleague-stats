# Biwenger Stats Project Instructions

This document centralizes all core engineering patterns for the **Biwenger Stats** repository.

---

## 🏗️ Pattern 1: Data-Driven Dashboard Features

**Sequence**: Query → Service → Route → Component

### 1. Database Query

**File**: `src/lib/db/queries/<domain>/<file>.ts`

- Use pure SQL via Drizzle's `sql` template tag (or query builder for simple CRUD).
- Zero business logic. Explicitly type return values.
- **Export**: Add to `src/lib/db/index.ts`.

### 2. Service Layer

**File**: `src/lib/services/<domain>Service.ts`

- **Mandatory**: Add `import 'server-only';` at the top.
- Handle business logic, data enrichment, and unified data shapes.
- Consume queries only from `src/lib/db`.

### 3. API Route

**File**: `src/app/api/<section>/<name>/route.ts`

- Keephandlers thin (~20 lines).
- Validate input → call service → return via `successResponse` / `errorResponse`.
- Use `CACHE_DURATIONS` for performance.

### 4. Card Component

**File**: `src/components/<section>/<Name>Card.js`

- **Client Component**: Use `'use client'`.
- Use `useApiData` for fetching and `useClientUser` for session context.
- Wrap in the `Card` UI component for consistent styling.

---

## 🔄 Pattern 2: Sync & ETL Pipeline

**Sequence**: Mutation → Step → Orchestrator

### 1. Database Mutation (Writes)

**File**: `src/lib/db/mutations/<domain>.ts`

- **Mandatory**: Use `INSERT ... ON CONFLICT DO UPDATE` (Upsert).
- Ensure operations are **Idempotent** (safe to re-run).

### 2. Sync Step

**File**: `src/lib/sync/steps/<NN>-<name>.ts`

- Fetch from external API → Map fields → Call mutation.
- Only call **mutations** (writes), never queries (reads).
- Sequential numbering (e.g., `14-tournaments.ts` → `15-`).

### 3. Orchestration

**File**: `src/lib/sync/index.ts`

- Register the step in the main `sync()` function loop.

---

## ✅ Best Practices

- **Design**: Follow the "Premium Dashboard" aesthetic (Glow effects, Spotlight cards).
- **Types**: Maintain strict TypeScript safety in the backend.
- **Next.js**: Use v16 conventions (App Router, Metadata API, server-only).
- **Sync**: Full pipeline via `npm run sync`, live scores via `npm run sync:live`.
