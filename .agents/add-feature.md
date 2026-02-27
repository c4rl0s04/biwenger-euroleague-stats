# Skill: Add a New Dashboard Feature

Use this when adding a new data-driven card or section that requires a backend endpoint, business logic, and a frontend component.

---

## Steps

### 1. Add the DB query — `src/lib/db/queries/<domain>/<file>.ts`

Pure SQL via Drizzle. No business logic.

```typescript
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function getMyNewStat(userId: string) {
  const result = await db.execute(sql`
    SELECT ...
    FROM ...
    WHERE user_id = ${userId}
  `);
  return result.rows[0] ?? null;
}
```

Export it from `src/lib/db/index.ts`:

```typescript
export * from './queries/<domain>/<file>';
```

### 2. Add the service function — `src/lib/services/<domain>Service.ts`

Business logic: call one or more queries, enrich data, return a unified shape.
Always add `import 'server-only';` at the top.

```typescript
import 'server-only';
import { getMyNewStat } from '../db';

export async function fetchMyNewStat(userId: string) {
  const raw = await getMyNewStat(userId);
  // enrich / transform
  return raw;
}
```

Export from `src/lib/services/index.ts` if it exists as a barrel.

### 3. Add the API route — `src/app/api/<section>/<name>/route.ts`

Thin handler (~20 lines). Validate input → call ONE service → return.

```typescript
import { NextRequest } from 'next/server';
import { fetchMyNewStat } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateUserId } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdValidation = validateUserId(searchParams.get('userId'));
    if (!userIdValidation.valid) return errorResponse(userIdValidation.error, 400);

    const data = await fetchMyNewStat(userIdValidation.value);
    return successResponse({ data }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Failed to fetch data');
  }
}
```

### 4. Add the Card component — `src/components/<section>/<Name>Card.js`

Client component. Fetch via `useApiData`, read user from `useClientUser`.

```javascript
'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { SomeLucideIcon } from 'lucide-react';

export default function MyNewCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => (currentUser ? `/api/<section>/<name>?userId=${currentUser.id}` : null),
    {
      transform: (d) => d?.data || d,
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  return (
    <Card
      title="My New Stat"
      icon={SomeLucideIcon}
      color="blue"
      loading={loading}
      className="card-glow"
    >
      {!loading && data && <div>{/* render data */}</div>}
    </Card>
  );
}
```

### 5. Place the card in the page

Add `<MyNewCard />` inside the relevant `*Client.js` component.

---

## Checklist

- [ ] Query in `queries/<domain>/` — pure SQL, no logic
- [ ] Service in `services/` — `import 'server-only'` at top
- [ ] Route in `app/api/` — thin, uses `successResponse`/`errorResponse`
- [ ] Card in `components/` — `'use client'`, `useApiData`, `useClientUser`
- [ ] New query exported from `src/lib/db/index.ts`
