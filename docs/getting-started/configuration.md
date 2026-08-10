---
title: Configuration
description: Safe setup of database, authentication, provider, and feature configuration.
audience:
  - newcomer
  - contributor
  - operator
status: active
---

# Configuration

Start from `.env.example` or let `npm run setup` create `.env`. The complete variable contract lives
in the [environment variable reference](../reference/environment-variables.md); this guide only
covers the decisions needed for local setup.

## Choose a database target

Use either:

- Individual `POSTGRES_*` values for local PostgreSQL. In Docker, `DOCKER_POSTGRES_HOST` selects the
  host visible to containers.
- `DATABASE_URL` for a complete PostgreSQL connection string. When present, it takes precedence over
  individual connection values.

Confirm the target before any schema, repair, or synchronization command. Production fantasy data
is treated as non-reconstructable; see [database safety](../operations/database-safety.md).

## Connect Biwenger

`BIWENGER_TOKEN`, `BIWENGER_LEAGUE_ID`, and `BIWENGER_USER_ID` identify the private league and the
user used for data ingestion. The setup wizard can discover the latter two from a valid token.

The configuration layer supports season-specific overrides. Synchronization also requires an active
`SYNC_SEASON_ID`; consult [season lifecycle](../operations/season-lifecycle.md) before enabling it.

## Authentication and optional features

Set `AUTH_SECRET` to a strong random value. Login uses the password hash stored for each synchronized
application user. The setup wizard still writes `ACCESS_PASSWORD` for legacy/bootstrap tooling, but
the current Auth.js credentials provider does not authenticate directly against that environment
value.

Assistant features support Groq's OpenAI-compatible API and OpenAI. `AI_PROVIDER` selects the
provider; configure its corresponding key and optional model. If `AI_PROVIDER` is unset, the route
prefers Groq when `GROQ_API_KEY` is present and otherwise selects OpenAI. Missing provider credentials
do not prevent the rest of the application from starting.

## Verify

```bash
npm run db:verify
npm run db:verify:drizzle
```

These commands confirm connectivity and the Drizzle client. They do not replace the schema and
season audits required before sensitive database work.
