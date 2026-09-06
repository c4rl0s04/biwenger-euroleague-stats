---
title: Agent workflow
description: Reproducible setup, curated skills, architecture enforcement, and acceptance evidence.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Agent workflow

[AGENTS.md](../../AGENTS.md) is the repository instruction entry point. Agent compatibility files
link to it. The [migration ledger](../architecture/migration-status.md) records domain progress;
[application layers](../architecture/application-layers.md) describes the target architecture.

## Worktree setup

Use Node **24.20.0**, pinned in [.nvmrc](../../.nvmrc) and [.node-version](../../.node-version).
CI reads the same pin. With nvm, run `nvm install && nvm use`; another version manager is fine.
Do not change the machine-wide runtime or production deployment configuration as a setup side effect.

After creating a sibling worktree under the naming rules in AGENTS.md:

```bash
npm run worktree:setup
npm run dev:worktree
```

Setup checks the exact runtime and runs `npm ci`, including the existing Husky preparation. It does
not copy environment files, start syncs, create databases, or load provider credentials. Existing
application environment configuration remains a separate, explicit local-development choice.

The development action selects a stable port based on the checkout path, probes availability, and
prints its URL. Set `PLAYWRIGHT_BASE_URL` to that URL for manual browser verification. It never
silently reuses another worktree's server.

[Codex local environment](../../.codex/environments/environment.toml) exposes setup, Run, Verify,
and Browser tests. Codex-created worktrees use its setup hook; manually created sibling worktrees
must run the setup command themselves. Select the pinned Node version before launching the app.

## Repository skills

| Skill                                                                        | Scope                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------- |
| [feature-migration](../../.agents/skills/feature-migration/SKILL.md)         | Contract-preserving domain migration          |
| [project-ui](../../.agents/skills/project-ui/SKILL.md)                       | Existing product UI and responsive refinement |
| [next-best-practices](../../.agents/skills/next-best-practices/SKILL.md)     | Relevant App Router and RSC guidance          |
| [accessibility](../../.agents/skills/accessibility/SKILL.md)                 | Keyboard, focus, semantics and accessibility  |
| [tailwind-css-patterns](../../.agents/skills/tailwind-css-patterns/SKILL.md) | CSS utilities and responsive implementation   |
| [frontend-design](../../.agents/skills/frontend-design/SKILL.md)             | Deliberately requested new visual directions  |

Use the smallest relevant set. The repository skills are portable and require no optional global
plugin. Personal skills such as impeccable, API/interface design, and motion review can supplement
these when available and appropriate; they do not override scope or compatibility.

The overlapping branding, banner, slides, design-system, design, ui-styling, and ui-ux-pro-max bundles
were removed from repository discovery. They included unrelated marketing workflows, nonportable
Claude paths/tool names, or broken external symlinks. Their prior versions remain in Git history.
No user-wide skill or plugin is uninstalled. Install a specialized package only for a demonstrated
need, then verify its scripts, references, dependencies, and trigger descriptions.

`npm run skills:check` validates repository skill metadata, local Markdown references, and known
nonportable instruction patterns. It is a packaging check, not proof of the quality of skill advice.

## Architecture enforcement

`npm run architecture:check` parses source imports/re-exports with TypeScript resolution. It checks
cross-feature deep imports throughout source, feature dependency cycles including type edges,
client-safe runtime graphs, persistence ownership inside features, and migrated framework adapters.
It follows relative and alias imports, literal dynamic imports, and CommonJS requires.

[Policy](../../scripts/architecture/policy.json) lists the migrated pages/routes under enforcement.
Add entrypoints as each domain migrates. Legacy global modules are traversed when reached from
protected code; this is not a blanket migration of every old module. Nonliteral dynamic module
resolution in protected code fails and needs an exact reviewed exception because a static graph
cannot determine its target.

Existing debt uses exact edge exceptions with a reason and removal condition. Unused exceptions
fail, so resolved debt is removed. The current Matches-to-global-round-policy edge awaits the
Rounds server contract. Do not add broad directory exemptions to silence failures.

## Verification and handoff

Use [testing](testing.md) for all commands and browser prerequisites. `npm run verify` runs the
standard checks sequentially, with two Vitest workers to avoid resource contention, a database-disabled
build, and offline schema checks. Focused tests remain useful during development.

Record actual command results, baseline warnings, browser routes/viewports, and skipped checks.
Do not run production mutations to satisfy local validation. Keep a concrete completion checklist
for sustained setup or migration work; completion requires evidence for each item.
