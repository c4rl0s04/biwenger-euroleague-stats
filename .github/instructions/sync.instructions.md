---
applyTo: 'src/lib/sync/**'
---

All sync steps are part of the ETL pipeline that writes to Supabase PostgreSQL.
See `.agents/add-sync-step.md` for the full workflow.

## Rules

- Every step must be **idempotent** — use `INSERT ... ON CONFLICT DO UPDATE`, never plain `INSERT`
- Steps call **mutations only** (`src/lib/db/mutations/`) — never query functions
- Number new steps sequentially after the last (`14-tournaments.ts` is current last → next is `15-`)
- Register every new step in `src/lib/sync/index.ts`
- Use the `SyncManager` for logging: `manager.log('...')`

## Step skeleton

```typescript
import { SyncManager } from '../manager';
import { upsertSomething } from '../../db/mutations/<domain>';

export async function syncMyStep(manager: SyncManager): Promise<void> {
  manager.log('🔄 Syncing...');
  try {
    // fetch → transform → upsert
    manager.log(`✅ Done`);
  } catch (error) {
    manager.log(`❌ Error: ${error}`);
    throw error;
  }
}
```

## Running

```bash
npm run sync        # full pipeline
npm run sync:live   # live scores only
# single step debug:
npx tsx -r dotenv/config src/lib/sync/steps/<file>.ts
```

Required env vars: `BIWENGER_TOKEN`, `BIWENGER_LEAGUE_ID`, `BIWENGER_USER_ID`
