---
title: Environment Variable Reference
description: Runtime configuration and explicit safety overrides used by the repository.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Environment variable reference

`.env.example` is the canonical safe template. Next.js loads supported `.env*` files; standalone
scripts load dotenv before importing shared configuration. Do not commit real values.

## Database and build

| Variable                                            | Purpose                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`                                      | Complete PostgreSQL connection string; takes precedence over individual values. |
| `POSTGRES_HOST`, `POSTGRES_PORT`                    | Individual host and port configuration.                                         |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Individual database credentials and database name.                              |
| `POSTGRES_URL`                                      | Alternate connection value consumed by Drizzle tooling when configured.         |
| `DOCKER_POSTGRES_HOST`                              | Host passed to the app containers by Docker Compose.                            |
| `SKIP_DB`                                           | Use the build-time mock pool instead of connecting to PostgreSQL.               |
| `NODE_ENV`                                          | Standard development, test, or production mode.                                 |

## Biwenger and season

| Variable                        | Purpose                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| `BIWENGER_TOKEN`                | Server-side token used by background ingestion.                        |
| `BIWENGER_LEAGUE_ID`            | League bound to the selected season. Must be numeric for sync.         |
| `BIWENGER_USER_ID`              | Provider user identity used by ingestion. Must be numeric for sync.    |
| `BIWENGER_API_VERSION_FALLBACK` | Emergency version when `/account` auto-detection fails.                |
| `SEASON_ID`                     | Canonical `YYYY-YY` season identifier. Required for mutating sync.     |
| `SEASON_NAME`                   | Human-readable season name.                                            |
| `EUROLEAGUE_SEASON_CODE`        | Official provider code in `EYYYY` form matching the season start year. |
| `EUROLEAGUE_ADVANCED_API_URL`   | Optional Advanced API base URL override.                               |
| `EUROLEAGUE_ADVANCED_API_TOKEN` | Optional bearer token; free endpoints do not require one.              |
| `LEAGUE_START_DATE`             | Season start date in `YYYY-MM-DD` form.                                |
| `SEASON_AWARE_READS_CONFIRMED`  | Production operator assertion that reads isolate the activated season. |

Season lifecycle scripts additionally accept `NEXT_SEASON_ID`, `NEXT_SEASON_NAME`,
`SEASON_END_DATE`, and `SEASON_NOTES` for the record they create or close.

## Authentication and assistant

| Variable                         | Purpose                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`                    | Auth.js JWT/session encryption secret.                                                      |
| `ACCESS_PASSWORD`                | Legacy/bootstrap value still written by setup; not the direct current Auth.js login source. |
| `AI_PROVIDER`                    | `groq` or `openai`; invalid explicit values make the assistant unavailable.                 |
| `GROQ_API_KEY`, `GROQ_MODEL`     | Groq compatible-endpoint credentials and model.                                             |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | OpenAI credentials and model.                                                               |

When `AI_PROVIDER` is unset, assistant routing prefers Groq if `GROQ_API_KEY` exists and otherwise
selects OpenAI. Provider keys are server-only.

## Explicit safety and diagnostic flags

These flags are not normal persistent configuration:

| Variable                      | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `BACKUP_CONFIRMED`            | Required acknowledgement for season mutations.                           |
| `ALLOW_REMOTE_SCHEMA_AUDIT`   | Permit schema audit against a remote-looking target.                     |
| `ALLOW_REMOTE_SEASON_AUDIT`   | Permit season audit against a remote-looking target.                     |
| `ALLOW_REMOTE_PRICE_REPAIR`   | Permit applying price repair to a remote-looking target.                 |
| `ALLOW_REMOTE_TEST_DB`        | Permit optional DB tests against a remote target.                        |
| `ALLOW_SCHEMA_BOOTSTRAP`      | Explicitly permit transitional schema bootstrap where normally disabled. |
| `ALLOW_SYNC_ON_FROZEN_SEASON` | Non-production diagnostic override for the season guard.                 |
| `RUN_DB_TESTS`                | Enable optional database-backed integration tests.                       |
| `ANALYZE`                     | Enable bundle-analyzer configuration during the analyze build.           |

Review the relevant [operations runbook](../operations/README.md) before setting a safety flag.
