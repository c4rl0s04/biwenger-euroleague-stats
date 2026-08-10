---
title: Assistant
description: Conversational analytics, context construction, persistence, and provider boundaries.
audience:
  - user
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Assistant

`/assistant` provides a conversational interface over synchronized league and player data. It can
build general league context or focused player context and persist conversations for the current
user.

## Implementation map

- Page and UI: [`src/app/(app)/assistant`](<../../src/app/(app)/assistant>) and
  [`src/components/assistant`](../../src/components/assistant).
- Services: assistant generation, context, and player-context modules under
  [`src/lib/services/features`](../../src/lib/services/features).
- HTTP: `/api/assistant` and `/api/assistant/conversations/*`.
- Data: assistant conversation tables in [`schema.ts`](../../src/lib/db/schema.ts) plus the queries
  used to assemble analytics context.
- Provider: the OpenAI Node SDK configured for either Groq's compatible endpoint or OpenAI through
  `AI_PROVIDER` and the provider-specific key/model variables.

## Data and failure behavior

The browser calls internal authenticated routes; OpenAI credentials remain server-side. Context is
assembled from local PostgreSQL records before the provider request. Assistant availability can
fail independently because of missing configuration, provider errors, or model output, while the
rest of the product remains operational.

Prompts and responses can include private league information. Do not log full conversational
payloads or use real production conversations as fixtures. Model responses are generated analysis,
not authoritative database state.
