# Skill: Add a New Sync Step

Use this when adding a new data source or sync operation to the ETL pipeline.

---

## Steps

### 1. Create the step file — `src/lib/sync/steps/<NN>-<name>.ts`

Number it sequentially after the last existing step (currently `14-tournaments.ts` → next is `15-`).

```typescript
import { SyncManager } from '../manager';
// Import any Biwenger/Euroleague API clients needed
// import { fetchSomething } from '../../api/biwenger-client';
// Import mutations (writes) — never import query files here
import { upsertMyNewData } from '../../db/mutations/<domain>';

export async function syncMyNewStep(manager: SyncManager): Promise<void> {
  manager.log('🔄 Syncing my new data...');

  try {
    const rawData = await fetchSomething();

    for (const item of rawData) {
      await upsertMyNewData({
        id: item.id,
        // ... mapped fields
      });
    }

    manager.log(`✅ Synced ${rawData.length} items`);
  } catch (error) {
    manager.log(`❌ Error in sync step: ${error}`);
    throw error;
  }
}
```

**Key rules:**

- Steps use `INSERT ... ON CONFLICT DO UPDATE` (upsert) — never plain `INSERT`
- Steps must be idempotent — safe to re-run at any time
- Steps only call **mutations** (writes), never query functions
- Later steps can depend on earlier ones (e.g., lineups require players to exist)

### 2. Add a mutation if needed — `src/lib/db/mutations/<domain>.ts`

```typescript
import { Pool } from 'pg';
import { DbClient } from './users'; // re-use the shared DbClient type

export async function upsertMyNewData(db: DbClient, params: { id: number /* ... */ }) {
  await db.query(
    `INSERT INTO my_table (id, ...)
     VALUES ($1, ...)
     ON CONFLICT (id) DO UPDATE SET
       ... = EXCLUDED....`,
    [params.id /* ... */]
  );
}
```

### 3. Register the step in the orchestrator — `src/lib/sync/index.ts`

```typescript
import { syncMyNewStep } from './steps/15-myname';

// Inside the main sync() function, after the last step:
await syncMyNewStep(manager);
```

---

## Checklist

- [ ] Step file numbered sequentially in `sync/steps/`
- [ ] Uses upsert — idempotent
- [ ] Calls mutations only, not queries
- [ ] Registered in `src/lib/sync/index.ts`
- [ ] New mutation added to `src/lib/db/mutations/<domain>.ts` if required
- [ ] Env vars needed (`BIWENGER_TOKEN`, `BIWENGER_LEAGUE_ID`, `BIWENGER_USER_ID`) are present in `.env`

## Running & Debugging

```bash
npm run sync          # Full pipeline (all steps)
npm run sync:live     # Live-scores-only (lightweight)
# To test a single step, import and call it directly in a tsx script:
npx tsx -r dotenv/config src/lib/sync/steps/15-myname.ts
```
