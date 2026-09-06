# Biwenger Stats

Follow [the repository agent instructions](../AGENTS.md), including worktree isolation, feature
contracts, compatibility, database safety, and validation. Use [the knowledge base](../docs/README.md)
for task-specific context and [migration status](../docs/architecture/migration-status.md) for domain ownership.

The application uses Next.js App Router, React, Tailwind CSS, and PostgreSQL with Drizzle.
Migrated features use typed view models and may use TypeScript React components. Legacy JavaScript
components remain supported. Do not infer the target architecture from legacy directory names.
