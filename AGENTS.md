# Repository working conventions

## Git branches and worktrees

- Develop every new feature, fix, refactor, or other non-trivial change in a dedicated Git worktree.
- Do not implement new work directly in the primary repository checkout when an isolated worktree can be used.
- Before creating a worktree, inspect the current branch, working tree, and existing worktrees. Preserve all unrelated or uncommitted user changes.
- Create worktrees as siblings of the primary checkout, using the pattern `../biwengerstats-next-<short-task-name>`.
- Create branches with a descriptive conventional prefix:
  - `feature/<short-task-name>` for product features.
  - `fix/<short-task-name>` for bug fixes.
  - `refactor/<short-task-name>` for structural changes without intended behavior changes.
  - `chore/<short-task-name>` for maintenance and tooling.
  - `docs/<short-task-name>` for documentation-only work.
- Do not create branches whose names begin with `codex/`.
- Never reuse a worktree that contains unrelated uncommitted changes.
- If the requested branch already exists or is checked out in another worktree, use that worktree when it belongs to the same task; otherwise stop and report the conflict before making changes.
- Keep commits modular and scoped to the task. Do not stage, commit, discard, or rewrite unrelated user changes.
- Run relevant validation in the task worktree before committing or pushing.
- Only remove a task worktree or delete a branch after confirming its work has been integrated or the user explicitly requests removal.

## Starting new work

For a new implementation task, use this sequence unless the user explicitly requests a different workflow:

1. Inspect `git status`, the current branch, and `git worktree list`.
2. Choose a short descriptive task name and the appropriate branch prefix.
3. Create a sibling worktree from the intended base branch.
4. Perform all edits, tests, commits, and pushes from that worktree.
5. Report the branch and worktree path so the user can run and review the implementation locally.

Small read-only investigations and explanations do not require a new worktree. A trivial documentation or configuration edit may remain in the current worktree only when it is clean and the user has not requested isolation.

## Architecture boundaries

- Organize business-domain code under `src/features/<feature>` when a feature boundary exists or is being introduced.
- Use `public.ts` for client-safe components, view models, and types. Use `server.ts`, beginning with `import 'server-only'`, for services, queries, repositories, and other server-only exports.
- Do not deep-import another feature's internal queries, mappers, services, or components. Consume its deliberate `public.ts` or `server.ts` contract, or introduce a clearly owned shared abstraction only when reuse is demonstrated.
- Keep `src/components/ui` limited to domain-agnostic visual primitives. Feature-specific cards, charts, tables, screens, and interaction components belong to their owning feature.
- Avoid speculative global abstractions. Similar appearance alone is not sufficient reason to merge components with different domain behavior.
- Pages and layouts should remain thin framework adapters: parse framework inputs, invoke feature services, and compose feature screens.
- Prefer this read flow: `Page or Route Handler -> feature service -> query or repository -> mapper -> serializable view model -> screen or component`.
- Server Components should call server services directly. Do not add or call internal REST endpoints solely to move data between code running in the same application.
- Route Handlers that expose an existing HTTP contract must reuse the same feature services as Server Components rather than duplicate queries or business logic.
- Database and Drizzle access belongs in a feature query or repository layer, or in clearly owned database infrastructure. Do not access the database directly from pages, presentation components, or Route Handlers.
- Presentation components must not receive raw Drizzle records, provider responses, or database-shaped objects. Map them to explicit, typed, plain, serializable view models first.
- Keep Client Components focused on browser interaction and local UI state. Data passed from Server Components to Client Components must be serializable.
- Desktop and mobile may use different compositions, but they should consume the same domain view models and preserve information parity unless a product requirement explicitly says otherwise.

## Contracts, validation, and caching

- Define typed input and output contracts at feature boundaries. Avoid `any`, `Record<string, any>`, and implicit database result types at public boundaries.
- Validate untrusted input at system edges, including route parameters, query strings, request bodies, environment variables, and third-party provider responses. Do not scatter redundant validation between trusted internal functions.
- Treat existing URLs, navigation, query parameters, response envelopes, status codes, ordering, and observable error behavior as compatibility contracts during refactors.
- Prefer additive, backward-compatible contract changes. Do not silently remove fields or change their meaning or type.
- Each feature service must make its access policy and freshness policy explicit. Preserve existing cache behavior during structural migrations unless a cache change is specifically authorized.
- Never apply public caching to authenticated, user-specific, credential-related, or mutation responses. Such responses must use an appropriate private or no-store policy.
- Do not assume application proxy or page protection also protects `/api` routes. Every Route Handler must deliberately enforce or document its own authentication and authorization policy.
- Preserve and explicitly handle loading, empty, not-found, validation-error, and unexpected-error states. Use the appropriate Next.js route boundaries where applicable.

## Security and external systems

- Never expose credentials, provider tokens, encryption material, or sensitive session data through responses, serialized props, client components, logs, errors, fixtures, or snapshots.
- Do not log secrets or complete third-party payloads. Log only the minimum identifiers and metadata needed for diagnosis.
- Architectural read-flow refactors do not authorize changes to authentication, sessions, credential encryption, keyrings, plaintext fallback behavior, provider mutations, or authorization policy.
- Do not perform real provider mutations, production database operations, secret rotation, deployment configuration changes, or environment-variable changes unless the user explicitly authorizes them.
- Do not modify database schemas or create or apply migrations unless schema work is explicitly in scope. When authorized, keep schema changes and data migrations reviewable and independently verifiable.

## Refactor compatibility and scope

- Architectural refactors must preserve current URLs, navigation, authentication and authorization behavior, HTTP contracts, cache semantics, visual appearance, interactions, and desktop/mobile information parity unless the task explicitly changes them.
- A refactor does not authorize a visual redesign, dependency upgrade, framework migration, unrelated cleanup, deployment, or changes to another feature.
- Do not mix read-model restructuring with security-sensitive mutations unless the task explicitly covers both.
- Remove obsolete files and duplicate implementations only after verifying that they have no remaining consumers.
- Keep temporary compatibility adapters only when necessary to preserve a current contract, document why they exist, and avoid creating parallel permanent implementations.

## Validation expectations

- Establish a relevant baseline before a non-trivial refactor so pre-existing failures are distinguishable from regressions.
- Add focused tests for feature boundaries, validation, mappers, services, access and cache policy, and preserved HTTP contracts where applicable.
- For architecture migrations, verify that pages and presentation components do not import database/query internals and that client-safe entrypoints do not export server-only code.
- Before handing off implementation work, run the relevant project checks, normally including typecheck, focused tests, the full test suite, lint, production build, and `git diff --check`.
- Run schema or migration consistency checks when the affected code reads database-backed models, even when no schema change is intended.
- Report every validation command and its result, remaining risks, any unverified visual behavior, and whether the task worktree is clean.
- Do not report a task as complete when required validation was skipped or failed; state the exact limitation instead.
