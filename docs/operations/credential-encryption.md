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
stores only versioned ciphertext metadata. `users.biwenger_token` remains temporarily for migration
and rollback; normal application writes never add plaintext to it.

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

## Safe deployment and migration

Use separate verification gates. Do not run these steps from an untrusted workstation.

1. Integrate commit `4c78956` into the production branch and deploy the containment hotfix by
   itself. Verify safe session, route, provider-gateway, and redaction tests before continuing.
2. Rotate `AUTH_SECRET` after the containment deployment. This intentionally signs users out; tell
   users they must sign in again. Never roll back to code that puts the provider token in sessions.
3. Take and verify a database backup. Generate and configure a production-only credential keyring.
   Set `BIWENGER_CREDENTIAL_PLAINTEXT_FALLBACK=true` for the migration window.
4. Apply `drizzle/0010_encrypted_biwenger_credentials.sql` before deploying code that queries the new
   table. The migration is additive and does not touch plaintext rows.
5. Deploy the encryption application. Vercel traffic switching should keep the mixed-version window
   short. Old instances can read existing plaintext rows; a user linked or relinked by new code is
   encrypted-only and may fail on an old instance. Do not prolong this window or roll traffic back
   casually.
6. Inspect counts with `npm run credentials:status`. Run `npm run credentials:migrate` first as a
   dry run. It prints only counts, key IDs, and error categories.
7. After backup and target verification, run
   `ALLOW_REMOTE_CREDENTIAL_MAINTENANCE=true npm run credentials:migrate -- --apply`. The utility
   encrypts and verifies each legacy value, does not clear plaintext, continues after isolated
   failures, and is safe to rerun.
8. Rerun the dry run. Migration coverage is complete when every legacy row is reported
   `alreadyVerified`, `wouldMigrate` is zero, and `failed` is zero. Test a small authorized sample
   through non-mutating linked-state and lineup reads. Never print or compare token values manually.
9. Investigate failed categories. Invalid provider credentials may still encrypt correctly; provider
   rejection is handled by asking that user to reconnect. Corrupt envelopes or unavailable keys
   require restoring the correct key configuration or re-linking, never plaintext logging.
10. Keep the fallback through an observation and rollback window. Monitor categorical credential
    failures, legacy-fallback warnings, link failures, and provider rejection rates.
11. Disable `BIWENGER_CREDENTIAL_PLAINTEXT_FALLBACK` only after full encrypted coverage, zero recent
    fallback usage, all application instances on the encrypted version, and a tested rollback plan.
12. In a separately approved cleanup, clear verified plaintext values. After another backup and
    observation window, remove `users.biwenger_token` in a later schema migration. Neither cleanup
    happens in the encryption stage.

## Linking, relinking, and unlinking

The link route validates credentials with Biwenger before the database transaction. A successful
link or relink encrypts with the active key, verifies a local round trip, atomically upserts the
encrypted record, updates email, and clears that user's legacy value. Provider validation failure
leaves the previous record unchanged. The browser receives only linked state.

The server boundary also provides unlink deletion. It atomically deletes the encrypted row and
clears legacy plaintext, after which linked-state checks return false. There is currently no
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
