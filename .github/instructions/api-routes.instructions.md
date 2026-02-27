---
applyTo: 'src/app/api/**'
---

API route handlers must be thin (~20 lines). No business logic here.

## Pattern

```typescript
import { NextRequest } from 'next/server';
import { myServiceFunction } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateUserId } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdValidation = validateUserId(searchParams.get('userId'));
    if (!userIdValidation.valid) return errorResponse(userIdValidation.error, 400);

    const data = await myServiceFunction(userIdValidation.value);
    return successResponse({ data }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('API Error:', error);
    return errorResponse('Failed to fetch data');
  }
}
```

## Rules

- Call exactly ONE service function per route
- Always use `successResponse` / `errorResponse` from `@/lib/utils/response`
- Cache durations: `SHORT` 1 min · `MEDIUM` 5 min · `LONG` 15 min
- Validate all input with helpers from `@/lib/utils/validation`
- Never import `db` directly — all DB access goes through `lib/services/`
- File must be TypeScript (`.ts`)
