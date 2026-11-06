---
title: Environment Variable Reference
description: Deployment settings, optional capabilities, and command-scoped safety controls.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Environment variable reference

[.env.example](../../.env.example) is the basic template. Next.js loads its supported `.env*` files.
Standalone application scripts load inherited environment values first, then `.env.local`, then
`.env`, without overriding an earlier value. `ENV_LOCAL_FILE` and `ENV_FILE` can select explicit
files for diagnostics. Never commit real settings or use `NEXT_PUBLIC_` for credentials.

## Required application settings

| Variable       | Purpose                                                                                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | Sole PostgreSQL connection URL, required for database-backed execution. Supports `postgres:` and `postgresql:`. Missing/malformed URLs fail without echoing them. |
| `AUTH_SECRET`  | Existing Auth.js session encryption secret. Preserve it during configuration migration.                                                                           |

`POSTGRES_URL` and split `POSTGRES_*` application connection settings are no longer read.
Docker's PostgreSQL service still accepts initialization user/password/database settings; those
configure the database container, not the application's connection parser. See [Docker](../operations/docker.md).

## Personal accounts and ingestion

| Variable                            | Purpose                                                                                                                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BIWENGER_CREDENTIAL_KEYS`          | Existing JSON keyring: array of objects with `id` and `key`; each key is 32 random bytes encoded as standard base64. Server-only.                   |
| `BIWENGER_CREDENTIAL_ACTIVE_KEY_ID` | Selects a key already present in the keyring for new credential writes.                                                                             |
| `PERSONAL_BIDS_USER_ID`             | Single permitted personal-bidding account. Missing/malformed configuration denies access. Copy the old permitted account explicitly during cutover. |
| `BIWENGER_TOKEN`                    | Background ingestion credential only; not required for normal analytics or personal actions.                                                        |
| `BIWENGER_API_VERSION_FALLBACK`     | Optional emergency version if automatic discovery fails.                                                                                            |
| `EUROLEAGUE_ADVANCED_API_URL`       | Optional official-provider base URL override.                                                                                                       |
| `EUROLEAGUE_ADVANCED_API_TOKEN`     | Optional bearer token for the official provider.                                                                                                    |

Personal credentials stay encrypted in PostgreSQL. Ingestion resolves the token's account identity
from `/account` and requires exactly one membership matching the resolved database season's league.
Personal provider operations use the signed-in manager's credential and the selected active season;
live operations reject frozen/historical selections.

## Seasons are database records

Runtime no longer reads `SEASON_ID`, `SEASON_NAME`, `EUROLEAGUE_SEASON_CODE`, `LEAGUE_START_DATE`,
`BIWENGER_LEAGUE_ID`, `BIWENGER_USER_ID`, or `SEASON_AWARE_READS_CONFIRMED`.

Explicit read selection wins over the `NEXT_SEASON_ID` browser cookie, then the uniquely active
season is used. Database failures do not fall back to a hard-coded season. Sync uses the active
season or an explicit `--season` target and retains writable-season and provider-binding guards.
Names, dates, official codes and league bindings are supplied once through the
[season lifecycle](../operations/season-lifecycle.md) command, not redeployed each season.

`ACCESS_PASSWORD` is removed. Application login still checks stored account password hashes.

## Optional assistant and monitoring

| Variable                         | Purpose                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `AI_PROVIDER`                    | Explicit `groq` or `openai`. Invalid selections make the assistant unavailable.             |
| `GROQ_API_KEY`, `OPENAI_API_KEY` | Set the selected provider's key; both remain server-only.                                   |
| `AI_MODEL`                       | Optional model override for the selected provider; otherwise use its code default.          |
| `NEXT_PUBLIC_SENTRY_DSN`         | Optional public browser reporting destination and shared server default.                    |
| `SENTRY_DSN`                     | Optional server-only override when server reporting intentionally uses another destination. |

During rollout only, `GROQ_MODEL`/`OPENAI_MODEL` remain fallback aliases and unset `AI_PROVIDER`
retains previous key-based selection. `AI_MODEL` wins over aliases. Provision the same explicit
provider/model before retiring compatibility; see the
[cutover checklist](../operations/configuration-cutover.md). Missing AI credentials do not stop analytics.
Browser Sentry configuration never reads the private server DSN. Error redaction remains enabled.

## Framework and command controls

`NODE_ENV`, `NEXT_RUNTIME`, `CI`, `VERCEL`, `PORT`, `HOSTNAME`, and telemetry controls belong to the
framework, hosting platform or container. They are not ordinary setup inputs. `SKIP_DB=true` selects
a mock pool for isolated builds/checks, not a production database or season. `ANALYZE=true` enables
bundle analysis.

Maintenance keeps explicit `BACKUP_CONFIRMED`, `ALLOW_REMOTE_SCHEMA_AUDIT`,
`ALLOW_REMOTE_SCHEMA_REPAIR`, `ALLOW_REMOTE_SEASON_AUDIT`, `ALLOW_REMOTE_PRICE_REPAIR`,
`ALLOW_REMOTE_CREDENTIAL_MAINTENANCE`, `RUN_DB_TESTS`, and `ALLOW_REMOTE_TEST_DB` protections.
Use them only for the relevant reviewed command, not as permanent application settings.
`ALLOW_SYNC_ON_FROZEN_SEASON` remains a non-production diagnostic override, never effective in
production. Browser/disposable-database harnesses own their synthetic variables and `PG_BINDIR`.
Simulation scripts own `SIMULATION_*` controls; deployment probes use `DEPLOYMENT_URL` or
`NEXT_PUBLIC_APP_URL`. Consult the command/runbook rather than adding these to basic setup.
