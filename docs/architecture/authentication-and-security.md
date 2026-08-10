---
title: Authentication and Security
description: Authentication boundaries, session contents, route protection, and secret-handling rules.
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

[`src/middleware.js`](../../src/middleware.js) initializes Auth.js from the edge-safe
[`auth.config.js`](../../src/auth.config.js). Its matcher excludes API routes and static Next.js
resources; the authorization callback permits `/login` and requires a session for other matched
pages.

The full credentials provider lives in [`src/auth.js`](../../src/auth.js) because it requires
PostgreSQL and bcrypt. It looks up a user by name, verifies the stored password hash, and includes
the user ID, email, and personal Biwenger token in the JWT-backed session.

## API responsibility

API routes are excluded from the page middleware. Each sensitive route must therefore enforce its
own authentication and authorization. Shared helpers are available in
[`api-auth.ts`](../../src/lib/utils/api-auth.ts), but coverage is not universally centralized.
Changing an endpoint requires reviewing its route-level checks and tests rather than assuming the
page middleware protects it.

## Secrets and private data

- Keep `.env`, provider tokens, `AUTH_SECRET`, `ACCESS_PASSWORD`, connection strings, and AI provider
  keys outside Git.
- Never expose the server-side Biwenger token to arbitrary clients or logs.
- Treat production exports and private league records as sensitive data.
- Use sanitized examples in tests and documentation.
- Report vulnerabilities privately rather than through a public issue containing exploit details.

See [configuration](../getting-started/configuration.md) for setup and the
[environment variable reference](../reference/environment-variables.md) for the complete contract.
