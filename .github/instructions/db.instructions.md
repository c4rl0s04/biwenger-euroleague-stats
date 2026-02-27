---
applyTo: 'src/lib/db/**'
---

The DB layer is split into two strict halves — never mix them.

## `queries/` — reads only

Pure SQL via Drizzle. Zero business logic, zero side effects.

```typescript
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function getMyData(userId: string): Promise<MyType[]> {
  const result = await db.execute(sql`SELECT ... WHERE user_id = ${userId}`);
  return result.rows as MyType[];
}
```

Domain → file mapping:

- `queries/core/` → users, players, teams
- `queries/features/` → market, search, predictions
- `queries/competition/` → rounds, matches, standings
- `queries/analytics/` → performance, advanced_stats, records

Export every new function from `src/lib/db/index.ts`.

## `mutations/` — writes only

UPDATE / DELETE / upsert operations. Same domain split as queries.
Used exclusively by the sync pipeline (`src/lib/sync/steps/`).

```typescript
export async function upsertMyRecord(db: DbClient, params: { id: number }) {
  await db.query(`INSERT INTO my_table (id) VALUES ($1) ON CONFLICT (id) DO UPDATE SET ...`, [
    params.id,
  ]);
}
```

## Schema changes

```bash
npx drizzle-kit generate   # generate migration SQL
npx drizzle-kit migrate    # apply to DB
```
