---
title: Docker Runbook
description: Start, inspect, and safely stop the Docker Compose environment.
audience:
  - newcomer
  - contributor
  - operator
status: active
---

# Docker runbook

The repository supplies a multi-stage application image and a Docker Compose environment with three
services: `postgres`, `app`, and `sync`.

## Prerequisites

- Docker Desktop or a compatible Docker Engine with Compose.
- A configured root `.env`; start from `.env.example` or run `npm run setup`.
- Confirmation of whether the application should use the local container database or a remote
  `DATABASE_URL`.

## Start

```bash
docker compose up -d --build
docker compose ps
docker compose logs app --tail=100
```

Open <http://localhost:3000>. To follow all logs:

```bash
docker compose logs -f
```

The local `postgres` service uses PostgreSQL 16 with pgvector and persists data in the named
`postgres_data` volume. The `app` service serves the Next.js standalone build on port 3000.

## Sync worker behavior

The `sync` service uses the same image and one `DATABASE_URL`. For local hosts (`postgres`,
`localhost`, loopback), it attempts routine sync every six hours. For remote hosts, automatic sync
is disabled; use an explicit approved command or separately scheduled workflow. Ingestion still
needs a token and an active, fully configured database season.

```bash
docker compose logs sync --tail=200
```

## Stop and recover

Stop containers without deleting data:

```bash
docker compose down
```

If the application image cannot find `.next/standalone`, confirm `output: 'standalone'` remains in
`next.config.mjs`, then rebuild.

Removing volumes is destructive and normally unnecessary. Only use the following command for a
confirmed disposable local database after resolving the exact Compose project:

```bash
docker compose down -v
```

That command deletes the local named database volume and cannot recover its contents. Never use it
as a generic fix for a production or non-disposable environment.

## Remote PostgreSQL

`DATABASE_URL` is the sole application connection setting. In containers, use the database service
hostname (`postgres`) for the bundled database, rather than the host machine’s `localhost`.
For host-run CLI tools use the published loopback port in that process’s environment; do not keep
competing application URL variables. Preserve the existing volume’s `POSTGRES_USER`,
`POSTGRES_PASSWORD`, and `POSTGRES_DB` initialization settings (local defaults are user `user` and database
`biwenger`). The Compose database container needs an explicit initialization password even when a
remote URL is selected; starting it does not redirect the app away from that URL.

Compose now forwards personal-credential, assistant and monitoring runtime settings. Browser-public
Sentry configuration is compiled by Next.js, so provide its public value in the build environment
when enabling browser reporting. See [configuration](../getting-started/configuration.md) and the
[cutover checklist](configuration-cutover.md).
