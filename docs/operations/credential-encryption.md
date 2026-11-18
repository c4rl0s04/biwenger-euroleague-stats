---
title: Biwenger Credential Encryption
description: Deployment, migration, rotation, rollback, and recovery for personal manager credentials.
audience:
  - operator
  - maintainer
  - agent
status: active
---

# Biwenger credential encryption

Personal manager credentials use AES-256-GCM with a fresh 96-bit IV. Authenticated data binds each
record to its user, purpose, envelope version, and key ID, so copying a record to another user or
changing its metadata fails integrity verification. The separate `user_biwenger_credentials` table
is the sole canonical store for personal manager credentials and stores only versioned ciphertext metadata.
The legacy `users.biwenger_token` column and plaintext fallback have been completely removed.

`BIWENGER_TOKEN` is different: it is the existing global credential for trusted background
ingestion. Do not put it in the personal credential keyring or migrate it into the manager table.

## Key creation and isolation

The proportionate initial production source is Vercel's encrypted environment-secret storage. It
fits the current deployment model and keeps keys out of Git, but authorized platform operators and
the running application can still access them. A managed KMS with envelope encryption is the later
upgrade when rotation policy, operator separation, or audit requirements justify its added service
and latency. Business services depend on a keyring interface, so that upgrade does not require
rewriting market or lineup operations.

Generate 32 random bytes on a trusted administrator workstation, for example with
`openssl rand -base64 32`. Transfer the result directly into the environment's secret manager; do
not paste it into tickets, chat, build logs, shell scripts, or Git. Configure:

```text
BIWENGER_CREDENTIAL_KEYS=[{"id":"prod-YYYY-NN","key":"<base64-encoded-32-byte-key>"}]
BIWENGER_CREDENTIAL_ACTIVE_KEY_ID=prod-YYYY-NN
```

Production, preview, local development, and automated tests must use unrelated keys. Never copy a
production database into a lower environment unless credential columns are removed. Key IDs may be
operationally visible; key values must not be. The application fails closed for missing, malformed,
duplicate, unknown, or wrong-length key configuration.

## Deployment and migration history

Migration `0010` added the encrypted credential table. During rollout, authorized maintenance
migrated and verified existing envelopes before plaintext fallback was removed. Migration
`0016` dropped the legacy `users.biwenger_token` column. All personal provider credentials now
live in `user_biwenger_credentials`. The plaintext migration utility was retired.

For current deployment and maintenance, configure the keyring, verify the schema and use
`npm run credentials:status`. Follow the rotation and rollback procedures below for changes to
existing encrypted credentials.

## Linking, relinking, and unlinking

The link route validates credentials with Biwenger before the database transaction. A successful
link or relink encrypts with the active key, verifies a local round trip, atomically upserts the
encrypted record, and updates email. Provider validation failure
leaves the previous record unchanged. The browser receives only linked state.

The server boundary also provides unlink deletion. It deletes the encrypted row,
after which linked-state checks return false. There is currently no
concrete unlink HTTP consumer, so no new credential endpoint was added. A future authenticated
unlink flow must call this boundary with the session actor and refresh the safe session state.

Market and lineup routes already pass the authenticated session user. Request bodies, route
parameters, and publicly viewed manager IDs cannot select the credential used for a command.

## Rotation

1. Add a new generated key to `BIWENGER_CREDENTIAL_KEYS` while retaining the old key.
2. Change `BIWENGER_CREDENTIAL_ACTIVE_KEY_ID` to the new ID and deploy. New writes now use it; old
   records remain readable.
3. Run `npm run credentials:rotate` as a dry run, then use `-- --apply` with the remote-maintenance
   safety flag after backup and target verification.
4. The utility decrypts with the stored key ID, re-encrypts with a fresh IV under the active key,
   verifies locally, and conditionally updates the unchanged row. Interrupted runs are resumable;
   concurrent changes are reported as conflicts rather than overwritten.
5. Use `npm run credentials:status` until no records depend on the old key. Keep the old key through
   the rollback window, then remove it and deploy. Never remove a key while its usage count is above
   zero.

## Rollback and recovery

The additive table and index can remain during code rollback. Existing users retain plaintext until
the later cleanup, so the pre-encryption application can still serve those records. New links and
relinks are encrypted-only; an old application cannot use them. For those users, restoring the
correct key configuration and forward-fixing is safer than copying credentials back to plaintext.

If key configuration is wrong, stop credential operations, restore the last known keyring without
changing records, and redeploy. Do not rotate or migrate while required old keys are unavailable. A
partial migration is recovered by fixing the categorized error and rerunning; verified plaintext is
not deleted by the utility. A partial rotation is recovered by retaining both keys and rerunning.
Conditional updates prevent an interrupted rotation from overwriting a newer relink.

Rollback must never restore credential-bearing JWTs, sessions, responses, or logs. Once plaintext
cleanup begins, prefer a forward fix unless a verified secure backup and the complete required
keyring are available.
