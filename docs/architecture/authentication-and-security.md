---
title: Authentication and Security
description: Authentication, credential, API, and database-access security boundaries.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Authentication and security

Authentication uses Auth.js v5 with a custom credentials provider and JWT sessions.

## Page protection

[`src/proxy.js`](../../src/proxy.js) initializes Auth.js from the edge-safe
[`auth.config.js`](../../src/auth.config.js). Its matcher excludes API routes and static Next.js
resources; the authorization callback permits `/login` and requires a session for other matched
pages.

The full credentials provider lives in [`src/auth.js`](../../src/auth.js) because it requires
PostgreSQL and bcrypt. It looks up a user by name, verifies the stored password hash, and includes
only the user ID, email, and a safe Biwenger linked-state boolean in the JWT-backed session.

## Personal provider credentials

Personal Biwenger credentials are encrypted at rest behind a server-only credential boundary.
[`user_biwenger_credentials`](../../src/lib/db/schema.ts) is the sole canonical store for those
credentials; the former plaintext user-column fallback has been removed. Client components,
sessions, public contracts, and logs receive only safe linked-state or categorical error information,
never credential material.

The encryption and rotation procedure is documented in the
[credential encryption runbook](../operations/credential-encryption.md). The durable design choice
is recorded in [ADR-0006](../decisions/0006-encrypted-personal-provider-credentials.md).

## API responsibility

API routes are excluded from the page middleware. Each sensitive route must therefore enforce its
own authentication and authorization. Shared helpers are available in
[`api-auth.ts`](../../src/lib/utils/api-auth.ts), but coverage is not universally centralized.
Changing an endpoint requires reviewing its route-level checks and tests rather than assuming the
page middleware protects it.

## Database access boundary

Application database reads and writes execute server-side through the shared PostgreSQL connection;
the browser does not use Supabase PostgREST as an application data path.

As defense in depth, Row Level Security is enabled on every application table and application-object
privileges are revoked from public Supabase API roles, including `anon`, `authenticated`, and
`service_role`. Default privileges are also constrained so newly created application objects do not
silently reopen that path.

This database lockdown does not replace application authorization. The server-side database
connection has the privileges required to execute application work, so pages, services, and Route
Handlers must still enforce the correct user and operation boundaries before issuing queries or
mutations.

See [database safety](../operations/database-safety.md) for exact verification and recovery
procedures and [ADR-0007](../decisions/0007-server-only-database-access.md) for the design rationale.

## Secrets and private data

- Keep `.env`, provider tokens, `AUTH_SECRET`, `ACCESS_PASSWORD`, connection strings, encryption
  keys, and AI provider keys outside Git.
- Never expose plaintext or encrypted Biwenger credential material to clients, sessions, public
  contracts, or logs.
- Treat production exports and private league records as sensitive data.
- Use sanitized examples in tests and documentation.
- Report vulnerabilities privately rather than through a public issue containing exploit details.

See [configuration](../getting-started/configuration.md) for setup and the
[environment variable reference](../reference/environment-variables.md) for the complete contract.
