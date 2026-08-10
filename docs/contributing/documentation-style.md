---
title: Documentation Style Guide
description: Conventions for writing and maintaining the project knowledge base.
audience:
  - contributor
  - maintainer
  - agent
status: active
---

# Documentation style guide

## Format

- Write portable GitHub-flavored Markdown. Do not require Obsidian-only syntax or plugins.
- Use lowercase `kebab-case.md` filenames. Use `README.md` only as a folder map of content.
- Start every note under `docs/` with `title`, `description`, `audience`, and `status` frontmatter.
- Use repository-relative Markdown links and descriptive link labels. Do not use bare paths as the
  only navigation mechanism.
- Store documentation images and exported diagrams in [`docs/_assets`](../_assets/README.md).
- Prefer Mermaid for flows that must remain editable and searchable.

The accepted `audience` values are `newcomer`, `contributor`, `maintainer`, `operator`, `agent`,
and `user`. The normal `status` values are `active`, `draft`, and `deprecated`.

## Content boundaries

- **Product notes** explain behavior and connect a domain across UI, HTTP, service, and data layers.
- **Architecture notes** document responsibilities and invariants, not step-by-step procedures.
- **Runbooks** provide prerequisites, safe commands, verification, recovery, and troubleshooting.
- **Reference notes** state factual contracts without repeating architectural explanations.
- **ADRs** capture a decision, its context, consequences, and alternatives.

Summarize a fact in one place and link to its canonical explanation. In particular, do not copy
environment-variable tables into setup guides or sync procedures into architecture notes.

## Code references

- Link to a stable directory when a note describes a subsystem.
- Link to a concrete source file when it is the source of truth for a contract.
- Verify commands against `package.json` and configuration against `.env.example` plus the code that
  consumes it.
- Describe current behavior. Use an ADR or Git history for historical rationale.

## Maintenance

Update documentation in the same pull request when changing behavior, routes, configuration,
schema, commands, architecture, or operational safety rules. Before committing, format Markdown and
run the documentation checks described in the [development workflow](development-workflow.md).
