---
title: 'ADR-0006: Encrypted Personal Provider Credentials'
description: Decision to isolate personal Biwenger credentials in encrypted server-only storage.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# ADR-0006: Encrypted personal provider credentials

- **Status:** accepted
- **Date:** 2026-09-15
- **Supersedes:** none

## Context

Private market and lineup operations require credentials belonging to the authenticated Biwenger
manager. Those credentials must survive application restarts but must not be exposed through JWT
sessions, client components, logs, public contracts, or ordinary user records. The project previously
retained a plaintext user-column path during migration, which created a second credential source and
an unnecessary rollback surface.

## Decision

Store personal manager credentials only in `user_biwenger_credentials`. Credential payloads are
encrypted server-side with AES-256-GCM using versioned key metadata and a fresh IV, with authenticated
metadata binding the envelope to its intended user and purpose.

Keys remain outside the database in the server configuration keyring. New writes use the configured
active key ID, while controlled maintenance tooling can inspect key usage and rotate encrypted
records. Sessions and client-facing models expose only safe linked-state information.

The legacy `users.biwenger_token` column and plaintext fallback are removed. The global
`BIWENGER_TOKEN` used for trusted background ingestion is a separate system credential and is not part
of the personal-manager credential store.

## Consequences

A database disclosure does not by itself reveal usable personal provider credentials, and copying an
encrypted record to another identity fails authenticated decryption. Key rotation can occur without
changing the application contract.

Operators must preserve the configured keyring during deployments and recovery. Losing every key
capable of decrypting an existing envelope requires restoring the correct key material or asking the
manager to reconnect; there is intentionally no plaintext fallback.

## Alternatives considered

- Store provider credentials in plaintext on `users`: operationally simple but exposes secrets to
  ordinary database reads, exports, and accidental logging.
- Put personal credentials into JWT sessions: avoids a database lookup but exposes long-lived provider
  material to a client-controlled boundary and complicates revocation.
- Encrypt a token column directly on `users`: protects ciphertext but couples account identity to
  provider-secret lifecycle and makes versioned rotation/metadata ownership less explicit.
