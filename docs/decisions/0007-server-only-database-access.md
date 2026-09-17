---
title: 'ADR-0007: Server-only Database Access'
description: Decision to keep application data access on the server and lock down public Supabase API roles.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# ADR-0007: Server-only database access

- **Status:** accepted
- **Date:** 2026-09-16
- **Supersedes:** none

## Context

The production database can be hosted on Supabase, but the application already performs reads and
writes through server-side PostgreSQL connections. Private league data includes credentials,
transactions, squads, assistant history, and other records that should not become reachable merely
because the hosted database also exposes a PostgREST Data API.

Relying only on application authentication would leave an unnecessary second data-access surface.
Relying only on Row Level Security would also be incomplete for roles such as Supabase
`service_role`, which can bypass RLS.

## Decision

Keep application database access server-only through the shared PostgreSQL client. Browser code does
not use Supabase PostgREST as an application data path.

Enable Row Level Security on every application table and revoke application-object privileges from
`PUBLIC`, `anon`, `authenticated`, and `service_role`. Constrain default privileges so future tables,
sequences, and routines do not silently reopen access. Preserve unrelated extension-owned routines
rather than applying destructive blanket changes to the whole `public` schema.

Application authentication and authorization remain explicit responsibilities of pages, services,
and Route Handlers. Database lockdown is defense in depth, not a replacement for per-request access
control.

## Consequences

Public Supabase API credentials cannot read or mutate application tables even if a client discovers
the project endpoint. The application has one deliberate database path to audit and operate.

Because the server connection has the privileges needed to perform application work, incorrect
server-side authorization can still expose data through an application endpoint. Route and service
security therefore remains mandatory. Any future decision to expose direct client-side database
access requires a new security design, explicit RLS policies, and a review of the role grants.

## Alternatives considered

- Use PostgREST directly from the browser with per-table RLS policies: viable for a different
  architecture, but adds a second application data path and requires a complete user-to-database-role
  authorization model.
- Leave the Data API roles with grants and rely on application secrecy: simple but creates an
  unnecessary external access surface.
- Disable the hosted Data API only through provider settings: useful defense in depth, but external
  configuration alone is less auditable and portable than committed database authorization rules.
