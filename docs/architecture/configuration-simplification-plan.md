---
title: Configuration simplification plan
description: Phased plan to remove duplicate environment configuration while preserving application, synchronization, and access behavior.
audience:
  - contributor
  - maintainer
  - operator
  - agent
status: draft
---

# Configuration simplification plan

## Scope and status

This is an implementation plan, not a description of completed changes. The source audit uses
main at `e0a28e19`. No private environment values, hosted secrets, or live database records were
inspected. Recheck consumers against the implementation base, including recently merged work.

The target is fewer settings and one owner per responsibility, preserving existing functionality:
URLs, responses, authentication, personal-bidding authentication and per-manager isolation, credential encryption, provider
operations, cache semantics, historical browsing, and desktop/mobile information parity.

This plan does not authorize production configuration changes, credential rotation, schema
application, provider mutations, or deployment. Each release needs a concrete reviewed cutover;
schema changes need their own explicit implementation scope and database-safety gate.

## Implementation status

Implementation is prepared on `refactor/config-simplification` from this plan's audited base.
C00–C06 have code, tests, templates and runbooks; C07 has a names-only
[cutover checklist](../operations/configuration-cutover.md). Hosted provisioning, production schema
application and release acceptance are pending operator review and CI, not claimed complete.

The assistant deliberately retains its old model aliases and implicit selection during cutover,
with behavioral tests and an explicit retirement gate. Existing deployments have not been inspected,
so removing these compatibility paths now could change the provider/model without confirmation.
Historical season-review reports and the dated EuroLeague roster collection remain pinned to the
season represented by their artifacts; they are not runtime season-selection fallbacks.

## Decisions

1. Application database access uses `DATABASE_URL` only. PostgreSQL container initialization keeps
   its own necessary inputs; application connection settings do not duplicate those inputs.
2. PostgreSQL owns season metadata and provider league binding. Resolve a season once per operation
   and pass its context; never infer it from today's date or silently fall back to a historical ID.
3. The environment owns deployment secrets and optional provider settings. No generic settings table, configuration framework, or new admin UI is needed.
4. Personal credentials remain encrypted in the database. Keep the existing keyring and active-key
   selection, and keep ingestion credentials separate from personal credentials.
5. Validate each capability at its boundary. Missing AI configuration does not disable analytics;
   web startup does not require ingestion credentials; real database access requires valid settings.
6. Preserve safeguards. Replace an old assertion only when equivalent executable protection and
   focused evidence exist. Maintenance confirmations remain explicit per command.

## Responsibility and final disposition

| Owner                     | Settings or information                                                                         | Target                                                                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database infrastructure   | `DATABASE_URL`                                                                                  | Sole application database input; required for database-backed execution.                                                                                                                       |
| Database infrastructure   | `POSTGRES_URL`, application `POSTGRES_*`, `DOCKER_POSTGRES_HOST`                                | Retire aliases and split application configuration after all consumers migrate. Keep container initialization inputs where needed.                                                             |
| Season infrastructure     | `SEASON_ID`, `SEASON_NAME`, `EUROLEAGUE_SEASON_CODE`, `LEAGUE_START_DATE`, `BIWENGER_LEAGUE_ID` | Read from the resolved database season. Accept metadata as explicit lifecycle-command input when creating a season.                                                                            |
| Season infrastructure     | `SEASON_AWARE_READS_CONFIRMED`                                                                  | Retire after season isolation, activation checks, and write guards are verified; not simply delete the guard.                                                                                  |
| Provider infrastructure   | `BIWENGER_TOKEN`                                                                                | Keep as an ingestion secret, required only for ingestion.                                                                                                                                      |
| Provider infrastructure   | Ingestion use of `BIWENGER_USER_ID`                                                             | Resolve account identity from the authenticated provider account and selected season league; fail on missing or ambiguous membership.                                                          |
| Market personal bidding   | Authorization use of `BIWENGER_USER_ID`                                                         | Remove the former single-account restriction at the user’s request; signed-in linked managers use their own credentials.                                                                       |
| Provider infrastructure   | `BIWENGER_API_VERSION_FALLBACK`                                                                 | Keep as an optional emergency override.                                                                                                                                                        |
| Provider infrastructure   | `EUROLEAGUE_ADVANCED_API_URL`, `EUROLEAGUE_ADVANCED_API_TOKEN`                                  | Keep optional override/token support; move out of the basic setup path.                                                                                                                        |
| Authentication            | `AUTH_SECRET`                                                                                   | Keep server-only; preserve session behavior.                                                                                                                                                   |
| Credential infrastructure | `BIWENGER_CREDENTIAL_KEYS`, `BIWENGER_CREDENTIAL_ACTIVE_KEY_ID`                                 | Keep both, preserving existing ciphertext compatibility and rotation behavior.                                                                                                                 |
| Setup                     | `ACCESS_PASSWORD`                                                                               | Remove: no current authentication consumer; do not modify database account passwords.                                                                                                          |
| Assistant                 | `AI_PROVIDER`, provider-specific API keys                                                       | Keep explicit provider selection and configure only its matching key. Preserve the selected provider through cutover; no forced AI adoption.                                                   |
| Assistant                 | `GROQ_MODEL`, `OPENAI_MODEL`                                                                    | Replace with optional `AI_MODEL`; keep provider-specific code defaults.                                                                                                                        |
| Observability             | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`                                                          | One shared DSN by default; retain server override for intentionally separate destinations. Do not erase a supported split configuration.                                                       |
| Framework/build           | `NODE_ENV`, `CI`, `VERCEL`, `NEXT_RUNTIME`, `PORT`, `HOSTNAME`, telemetry controls              | Leave with their framework/platform/container owner; not user setup requirements.                                                                                                              |
| Verification              | `SKIP_DB`, `ANALYZE`, test and simulation controls                                              | Keep in their commands/harnesses, outside normal runtime setup.                                                                                                                                |
| Maintenance               | Backup confirmations, remote-target overrides, lifecycle arguments                              | Keep command-scoped; prefer existing CLI flags, without broadening authorization.                                                                                                              |
| Documentation             | `SYNC_SEASON_ID`, `ALLOW_SCHEMA_BOOTSTRAP`, `SEASON_NOTES`                                      | Correct/remove stale documentation if a fresh consumer search still finds no active contract. The season-selection cookie named `NEXT_SEASON_ID` is distinct from lifecycle environment input. |

Personal bidding uses the existing authenticated-manager and encrypted-credential boundaries.
The user explicitly removed the former single-account restriction; no replacement role or setting
is introduced.

### Final basic setup

- Database-backed web application: `DATABASE_URL` and `AUTH_SECRET`.
- Personal account linking/actions: existing credential keyring settings.
- Ingestion job: `DATABASE_URL` and `BIWENGER_TOKEN`; season/league metadata comes from PostgreSQL.
- Assistant: optional `AI_PROVIDER`, matching provider key, and optional `AI_MODEL`.
- Monitoring: optional shared Sentry DSN and optional server override.

Use a concise `.env.example` for normal settings and the existing environment reference for advanced
controls. Do not create another full duplicated variable catalog. An empty database still needs
committed migrations, season creation, and ingestion; fewer environment settings do not replace setup.

## Implementation sequence

Each row is a scoped pull request or a deliberately split set if consumer coverage makes it too
large. Use dedicated worktrees. Code preparation is complete; release gates above remain pending.

| Task | Owner / dependency                           | Deliverable                                                                                                  |
| ---- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| C00  | Configuration inventory / first              | Confirm consumers, freeze compatibility expectations, remove proven legacy residue.                          |
| C01  | Database infrastructure / C00                | One database URL across app, scripts, Docker and workflows.                                                  |
| C02  | Season reads / C01                           | Database-owned season context for all normal reads.                                                          |
| C03  | Sync and provider / C02                      | Explicit writable-season/provider context, discovered ingestion identity, authenticated per-manager bidding. |
| C04  | Database writes / C03                        | Remove implicit season values from writers, then prepare removal of schema defaults.                         |
| C05  | Optional integrations / C00                  | Simplify assistant and monitoring settings without losing supported capabilities.                            |
| C06  | Setup and configuration retirement / C01–C05 | Finish setup, retire global legacy configuration, and reconcile documentation and deployment inputs.         |
| C07  | Release reconciliation / C06                 | Confirm environment cutover and focused end-to-end evidence before retiring old hosted settings.             |

C05 can be implemented independently after C00. Season reads must settle before sync and writes
move; setup retirement follows all consumer migrations. These are code ownership boundaries, not
new services, processes, or packages.

### C00 — Confirm contracts and remove proven legacy residue

- Inventory variable readers, indirect `CONFIG` consumers, exports, tests, fixtures, Docker, CI,
  setup output, and documentation. Do not inspect or record secret values.
- Record baseline expectations for current/historical reads, missing configuration, provider
  selection, private bidding, and maintenance target selection.
- Remove `ACCESS_PASSWORD` prompts/output/Compose forwarding and misleading setup text claiming
  ingestion tokens automate personal accounts. Preserve current stored password hashes.
- Verify and remove unconsumed `CONFIG.DB.PATH`, `CONFIG.EUROLEAGUE`, and `getDefaultSeasonId()`.
  Retain consumed `CONFIG.ENV` behavior until its caller is migrated.
- Correct stale variable documentation, including `SYNC_SEASON_ID` versus `SEASON_ID`.

Acceptance: no active consumer of deleted settings remains; login behavior is unchanged; setup no
longer asks for an unused password. Focused auth/setup checks and documentation checks pass.

### C01 — One application database connection

Primary locations: [database infrastructure](../../src/lib/db), [Drizzle config](../../drizzle.config.ts),
[database scripts](../../scripts/db), [workflows](../../.github/workflows),
[Docker Compose](../../docker-compose.yml), and [setup](../../scripts/setup.js).

- Make the database connection parser accept a nonempty PostgreSQL `DATABASE_URL`, fail clearly
  for missing/malformed settings, and never echo the connection address in errors.
- Preserve existing local/remote TLS behavior in this migration; changing TLS policy is separate.
- Reuse that parser for application, CLI, Drizzle and diagnostics. Preserve the existing raw `pg`
  pool and Drizzle instance rather than adding a new connection abstraction.
- Replace workflow `POSTGRES_*` wiring and shell preconditions, including finance and simulations.
  Preserve `PGOPTIONS` read-only and timeout protections.
- Compose must support both bundled local PostgreSQL and a remote database. The app and sync
  containers receive one URL; the database container retains initialization credentials. Document
  host versus container addresses without introducing two competing application URL settings.
- Preserve the remote-target automatic-sync restriction in Compose and all remote-command guards.

Acceptance: focused parser tests cover missing/malformed/local/remote URLs without printing secrets;
app/CLI/Drizzle agree on the target; Compose renders local and remote configurations using synthetic
inputs; no workflow still requires split application secrets; disposable database checks succeed.

Cutover: provision `DATABASE_URL` for every consuming runtime/job before removing old inputs.
Changing tracked wiring does not itself provision hosted secrets.

### C02 — Database-owned season reads

Primary locations: [season lookups](../../src/lib/seasons.ts),
[request season context](../../src/lib/seasons/server.ts),
[read-season resolver](../../src/lib/db/season-context.ts), and their feature consumers.

- Resolve explicit requested season, then selected-season cookie, then exactly one active season.
  Preserve explicit historical browsing and invalid-selection error behavior.
- Remove the catch-all fallback to environment/historical season when the database lookup fails.
  Missing, ambiguous or inaccessible active-season state must produce a deliberate existing
  error boundary or clear operational failure, never an unrelated season.
- Read landing labels and player-history dates from the resolved season. Check every metadata
  consumer rather than replacing only the central resolver.
- Reuse request-scoped deduplication; do not introduce persistent caching or cross-request state.
- Give build/test fixtures explicit season context through their harness. `SKIP_DB` must not become
  a production season selector or an authentication bypass.

Acceptance: focused checks cover explicit historical selection, cookie selection, active selection,
invalid IDs, zero/multiple active seasons, database failures and season-specific labels/dates.
Run focused desktop/phone season-selector and history checks; preserve existing URL/cache contracts.

### C03 — Sync, provider identity and private-bid policy

Primary locations: [sync manager](../../src/lib/sync/manager.ts),
[season guard](../../src/lib/sync/season-guard.ts), [preflight](../../scripts/sync/preflight.ts),
[provider boundary](../../src/features/provider/server), and [Market](../../src/features/market).

- Resolve a writable database season before provider work. Reuse `--season` for an explicit target;
  default to exactly one active season. Preserve locks, status, sync-enabled and provider-binding
  checks, and source ownership of writes.
- Pass season ID, dates, league ID and official code through the existing execution context.
  Remove global `CONFIG.API.LEAGUE_ID` mutation and redundant environment-based preflight reads.
- Resolve ingestion account identity using the token's authenticated `/account` response. The
  discovery request must not require the user/league identity it is trying to discover. Validate
  its response and the selected season's league membership; fail closed on ambiguity. Cache only
  within the job, with no cross-token identity reuse. Use mocked responses for development tests.
- Personal operations continue using the signed-in manager's encrypted credential and actor ID;
  they never inherit ingestion identity or credentials. Resolve the active writable league and
  reject historical-season mutations. Historical read-only browsing remains available.
- Remove the former single-account restriction. Every signed-in linked manager can access personal
  bidding using their own credentials. Preserve anonymous denial and premium/credit rules.
- Replace `SEASON_AWARE_READS_CONFIRMED` only after regression tests prove season-isolated reads
  and writes, while runtime guards still reject invalid activation and unwritable targets.

Acceptance: routine/bootstrap/live and official sync preflight use database metadata; explicit
season targeting still works; conflicting/missing provider membership stops before writes;
unauthorized personal bids remain denied; provider calls use the right actor/token/league;
no historical writes, token leaks, lock regression or added credit-spending calls.

### C04 — Explicit write seasons, then schema-default removal

Primary locations: [mutation factories](../../src/lib/db/mutations), feature write owners,
[schema](../../src/lib/db/schema.ts), fixtures, CLI callers and [migrations](../../drizzle).

- First require resolved season IDs in every seasonal writer and update all callers. Remove
  `CONFIG.SEASON.ID` fallbacks. Pure writers do not independently look up the active season.
- Audit inserts relying on the schema's hard-coded `2025-26` defaults, including test seeds and
  maintenance commands. Historical backfills must retain explicit historical targets.
- After caller coverage passes, prepare a separate migration removing those defaults from existing
  seasonal columns and match the source schema. Do not change historical migration files, IDs,
  existing records, foreign keys or season status as incidental cleanup.
- Keep lifecycle creation/freezing explicit, with arguments for the target, name, dates and provider
  bindings. Require existing backup and concurrency safeguards. Initial creation cannot depend on
  an active season already existing, or require an unrelated ingestion credential.

Acceptance: missing seasons cannot silently write historical records; explicit historical tooling
keeps its intended scope; source/metadata consistency and fresh disposable migration checks pass;
focused writer tests cover failures and cross-season isolation. Production application requires a
separately approved schema scope, backups, target audit and reviewed migration preview.

### C05 — Optional assistant and monitoring settings

- Use `AI_PROVIDER` plus its existing provider-specific key and optional `AI_MODEL`. Keep both
  providers, code defaults, current response/error contracts and server-only handling.
- During migration, preserve legacy model aliases and implicit provider selection only as a
  temporary compatibility path with tests and a documented removal task. Provision the equivalent
  explicit selection/model before removing that path. Never silently switch provider or model.
- With no explicit AI configuration after cutover, leave the assistant unavailable while the rest
  of the app runs. An invalid explicit selection or missing selected key produces a clear assistant
  error; it must not fall back to another provider.
- Use the public Sentry DSN as the shared default and preserve an explicit server override. Browser
  code reads only the public DSN; do not route private settings into the browser. Preserve redaction.
- Keep optional EuroLeague token/base URL and Biwenger version override with their current owner.

Acceptance: both AI providers, configured/default models, disabled state, invalid/missing settings
and migration aliases are covered. Browser/server Sentry destination tests and redaction checks pass.
No real AI calls are required to verify configuration routing.

### C06 — Setup, loading and global configuration retirement

- Standardize standalone-script loading before importing configuration: inherited environment wins,
  then `.env.local`, then `.env`. Use the already installed dotenv support and a small existing-owner
  loader if reuse requires it. Next.js retains framework-owned loading; no new dependency.
- Replace global secret-bearing `CONFIG` with focused server-only readers in existing owners.
  Keep pure constants browser-safe. Do not create one wrapper per variable or force all capabilities
  through an application-wide startup validator.
- Remove import-time ingestion warnings, duplicated fallback chains and Docker dummy provider
  credentials once builds prove they do not need them. Keep isolated build/test database behavior.
- Update setup to produce the final minimal settings and explain explicit database season setup.
  Include personal credential encryption setup; remove obsolete password and repeated season prompts.
  Existing `.env` replacement requires a deliberate backup/confirmation; never print saved secrets.
- Update the canonical environment reference, `.env.example`, Docker, CI and runbooks together;
  clearly separate normal runtime inputs from maintenance/test controls.
- Do not introduce configurable knobs for constants simply to move hard-coded values elsewhere.

Acceptance: generated setup is sufficient for its documented capabilities; inherited/local/default
loading precedence is tested; browser bundles contain no server secrets; builds do not require
provider keys; retired variables have no active readers/producers outside historical migration
artifacts; all deployment consumers have an explicit transition path.

### C07 — Cutover and final reconciliation

- Maintain a names-only checklist per runtime: web hosting, ingestion workflows, finance/simulation
  jobs and Docker. Record who provisions each final setting, its owner, and which old settings retire.
- Before each behavior cutover, confirm the required new names exist and metadata is populated,
  without copying secret values into logs, docs, PRs or fixtures. Resolve conflicting old/new settings
  explicitly; do not guess. Local environment edits and provider/production actions require scope.
- Verify login, current/historical browsing, season labels, account linked state, anonymous-bid denial,
  authorized mocked bidding, assistant disabled/enabled routing, sync preflight and CLI maintenance.
- Remove compatibility aliases only after every consumer has migrated. Keep an explicit stop/fail
  path when requirements are missing; do not restore silent historical defaults as a rollback.
- Keep old hosted secrets until the previous release is no longer the rollback target. Account for
  database-default removal when testing rollback; old writers may require defaults restored before
  rollback, through a separately reviewed migration. Do not rotate encryption/session keys here.

## Verification and completion evidence

Each implementation task establishes its focused baseline and adds behavioral tests where needed.
Run relevant focused Vitest checks, `git diff --check`, and documentation checks. Changes affecting
feature boundaries run `npm run architecture:check`; schema/model work runs the metadata consistency
checks in [testing](../contributing/testing.md) and isolated database verification. Browser checks
cover changed interactions. Use synthetic inputs and mocked providers, never real mutations as tests.

Every handoff records commands/results, unchanged failures, branch/worktree, remaining limitations,
and draft PR/CI state. Full CI runs after opening the PR; do not poll it. Completion requires passing
CI and reviewed cutover evidence, not merely fewer entries in `.env.example`.

| Completion gate         | Required evidence                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Configuration ownership | One owner per setting; no duplicate season metadata or secret-bearing browser config.                                     |
| Behavior preserved      | Current/historical read contracts, private access, credential compatibility, provider capabilities and caching verified.  |
| Write safety            | No implicit historical season writes; guarded active season, locks and membership checks retained.                        |
| Operational simplicity  | One database URL per runtime; season rollover does not require deployment-variable edits.                                 |
| Deployment readiness    | Names-only transition checklist covers every consumer; schema and rollback dependencies reviewed.                         |
| Cleanup                 | Current docs/templates match code; temporary aliases retired; no unrelated schema, UI, dependency or auth-policy changes. |

## References

- [Environment reference](../reference/environment-variables.md) — current variable contract until implementation updates it.
- [Application layers](application-layers.md) and [data and sync](data-and-sync.md) — ownership and source-specific persistence.
- [Authentication and security](authentication-and-security.md) and [credential encryption](../operations/credential-encryption.md) — preserved trust boundaries.
- [Database safety](../operations/database-safety.md) and [season lifecycle](../operations/season-lifecycle.md) — production and season operation gates.
