# Skill: Add a New Database Query

Use this when you need a new read operation against the database.

---

## Domain → File Mapping

Place the query in the right subdirectory under `src/lib/db/queries/`:

| Data type                              | File                                                            |
| -------------------------------------- | --------------------------------------------------------------- |
| Users, player ownership                | `queries/core/users.ts` or `queries/core/players.ts`            |
| Market, transfers, bids                | `queries/features/market.ts`                                    |
| Search                                 | `queries/features/search.ts`                                    |
| Predictions                            | `queries/features/predictions.ts`                               |
| Rounds, matches, standings             | `queries/competition/rounds.ts` / `matches.ts` / `standings.ts` |
| Per-round efficiency, ideal lineup     | `queries/analytics/performance.ts`                              |
| Advanced metrics (volatility, streaks) | `queries/analytics/advanced_stats.ts`                           |
| Season records (best/worst)            | `queries/analytics/records.ts`                                  |
| Tournaments / cup brackets             | `queries/tournaments.ts`                                        |

---

## Query Template

```typescript
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function getMyNewQuery(userId: string /* other params */): Promise<MyResultType[]> {
  const result = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      SUM(rs.points) AS total_points
    FROM players p
    JOIN round_stats rs ON rs.player_id = p.id
    WHERE rs.user_id = ${userId}
    GROUP BY p.id, p.name
    ORDER BY total_points DESC
  `);

  return result.rows as MyResultType[];
}
```

**Rules:**

- Zero business logic — only SQL + mapping
- Always type the return value
- Use Drizzle `sql` template tag for raw SQL; use Drizzle query builder for simple CRUD
- Null-safe: return `[]` for lists, `null` / `?? null` for single-row lookups

---

## Export the query

Add it to `src/lib/db/index.ts`:

```typescript
export * from './queries/<domain>/<file>';
```

Then import in services using:

```typescript
import { getMyNewQuery } from '../db';
```

---

## Checklist

- [ ] Placed in the correct domain subfolder
- [ ] Pure SQL — no service logic, no HTTP
- [ ] Return type is explicitly typed
- [ ] Exported from `src/lib/db/index.ts`
- [ ] Consumed only from `src/lib/services/` (never directly from routes or components)
