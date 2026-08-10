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

The `sync` service reuses the application image. With no `DATABASE_URL`, it runs a full sync on
startup and attempts a daily sync every six hours. When `DATABASE_URL` is set, it deliberately
sleeps instead of automatically writing to the remote database. Remote synchronization is expected
to be scheduled separately.

The worker still requires valid Biwenger and season configuration. Inspect its logs before assuming
the database was populated:

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

`DATABASE_URL` takes precedence over individual `POSTGRES_*` values. The Compose file still starts
the local PostgreSQL service unless its service selection is changed, but the app ignores it when a
connection string is supplied. Review [configuration](../getting-started/configuration.md) and
[database safety](database-safety.md) before targeting a remote database.
