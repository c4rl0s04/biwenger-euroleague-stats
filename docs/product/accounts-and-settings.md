---
title: Accounts and Settings
description: Login, manager profiles, account linkage, and personal settings.
audience:
  - user
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Accounts and settings

## Routes and behavior

- `/login` authenticates a synchronized application user through name and password.
- `/user/[id]` presents a manager profile with squad and performance history.
- `/settings` manages account information, password changes, and personal Biwenger linkage.

Authentication mechanics and route boundaries are documented in
[authentication and security](../architecture/authentication-and-security.md).

## Implementation map

- Pages: [`login`](<../../src/app/(auth)/login>), [`user/[id]`](<../../src/app/(app)/user/[id]>), and
  [`settings`](<../../src/app/(app)/settings>).
- UI: [`src/components/user`](../../src/components/user) plus settings-local components.
- Services: [`userService.ts`](../../src/lib/services/core/userService.ts) and lineup/player services
  used by manager profiles.
- HTTP: `/api/auth/*`, `/api/user/change-password`, `/api/user/link-biwenger`, and `/api/users/*`.
- Data: user queries and mutations under [`src/lib/db`](../../src/lib/db).
- Tests: [`user-routes.test.ts`](../../src/app/api/user/__tests__/user-routes.test.ts) plus Auth.js
  behavior exercised through the application build and route-level tests.

## Security constraints

Passwords are stored as bcrypt hashes. Personal Biwenger tokens are server-side credentials and
must not be displayed to other managers. A user may update their own account and linkage; routes
performing those mutations must validate both the session and target identity.
