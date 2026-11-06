---
title: Configuration
description: Set up deployment secrets and database-owned season configuration.
audience:
  - newcomer
  - contributor
  - operator
  - agent
status: active
---

# Configuration

Copy `.env.example` or run `npm run setup` to create a new `.env`. Setup masks secret input, refuses
to overwrite an existing file, and makes no provider requests. Preserve existing session secrets
and credential encryption keys when upgrading. The full contract is in the
[environment reference](../reference/environment-variables.md).

## Connect the application

Supply one `DATABASE_URL` and `AUTH_SECRET`. Local PostgreSQL and hosted PostgreSQL use the same
connection contract; no split application connection variables are needed. With Docker, the URL's
hostname must be reachable from the container; see [Docker](../operations/docker.md).

Initialize an empty database with committed migrations, then create a season through the explicit
[season lifecycle](../operations/season-lifecycle.md) command. No season metadata belongs in the
deployment environment. Normal reads use the selected season or the uniquely active season.

## Enable optional capabilities

- Ingestion uses `BIWENGER_TOKEN`; the database season supplies the league, dates and official code,
  while provider account discovery supplies ingestion identity.
- Personal account linking/actions use the existing server-only credential keyring and encrypted
  credentials stored in PostgreSQL. Login passwords are checked against stored hashes.
- Personal bidding is available to signed-in managers using their own linked credentials; no extra account setting is needed.
- The assistant uses an explicit provider, its matching key and optionally `AI_MODEL`.
- Sentry reporting is optional. Browser reporting uses only the public DSN.

Run `npm run db:check` for connectivity and schema-readiness diagnostics after confirming the target.
This is not permission to mutate a remote database. Existing deployments must follow the
[configuration cutover checklist](../operations/configuration-cutover.md) before removing old inputs.
