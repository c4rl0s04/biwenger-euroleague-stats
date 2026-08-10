---
title: Application Layers
description: Request flow and responsibility boundaries across UI, HTTP, services, and data access.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Application layers

New data-backed features should normally follow this direction:

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Page / Client component
  participant API as Route handler
  participant S as Service
  participant Q as Query or mutation
  participant DB as PostgreSQL

  U->>UI: Interact
  UI->>API: Internal HTTP request
  API->>API: Authenticate and validate
  API->>S: Call domain operation
  S->>Q: Read or write
  Q->>DB: SQL through shared pool
  DB-->>Q: Rows
  Q-->>S: Typed data
  S-->>API: Result
  API-->>UI: Standard response
```

## Boundaries

- **Pages and components** own presentation, interaction, and route-level composition. Most
  authenticated page entries live under [`src/app/(app)`](<../../src/app/(app)>).
- **Route handlers** own HTTP parsing, authentication, validation, response status, and cache
  headers. They live under [`src/app/api`](../../src/app/api).
- **Services** combine queries, apply business rules, and shape domain responses. Server-exclusive
  services should import `server-only`.
- **Queries** in [`src/lib/db/queries`](../../src/lib/db/queries) read data. **Mutations** in
  [`src/lib/db/mutations`](../../src/lib/db/mutations) write it.
- [`src/lib/db/index.ts`](../../src/lib/db/index.ts) exposes the Drizzle client and a temporary legacy
  `pg` bridge over one shared pool.

The repository is still completing this separation. A small number of route handlers access Drizzle
or mutations directly, particularly authentication, account, and Hoopgrid routes. Treat those as
explicit current-state exceptions, not examples for unrelated new endpoints.

## Client data flow

Interactive JavaScript components commonly fetch internal APIs with
[`useApiData`](../../src/lib/hooks/useApiData.js). HTTP responses normally use the helpers in
[`response.ts`](../../src/lib/utils/response.ts) to return either `{ success: true, data }` or
`{ success: false, error }`.

Some App Router pages and specialized endpoints use different shapes. Consult the
[internal API reference](../reference/internal-api.md) and route tests before changing a contract.

## Server and Client Components

Page modules default to Server Components unless marked with `use client`. Interactive domain
components commonly provide a `*Client.js` boundary. Keep secrets, direct database access, and
provider credentials on the server side; pass only required serializable data into client code.
