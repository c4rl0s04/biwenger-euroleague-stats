---
title: Documentation Home
description: Entry point for the Biwenger Stats project knowledge base.
audience:
  - newcomer
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Biwenger Stats documentation

This folder is both the project knowledge base and a portable [Obsidian](https://obsidian.md/)
vault. It uses standard Markdown links so every note remains usable in GitHub and ordinary
editors without Obsidian plugins.

## Choose your path

- **New to the repository:** start with the [getting-started map](getting-started/README.md).
- **Exploring the product:** use the [product map](product/README.md).
- **Changing the system:** read the [architecture map](architecture/README.md) and
  [contributor guides](contributing/README.md).
- **Running or recovering the application:** use the [operations map](operations/README.md).
- **Looking up a contract:** use the [reference map](reference/README.md).
- **Understanding why a choice was made:** browse the [architecture decisions](decisions/README.md).

## Knowledge model

The vault is organized by documentation purpose rather than by source-code folder:

- **Getting started** explains how to reach a working development environment.
- **Product** connects user-visible domains to routes and their technical implementation.
- **Architecture** describes stable boundaries, flows, and system invariants.
- **Operations** contains procedures that can be followed during setup, sync, or recovery.
- **Reference** records factual contracts such as commands, configuration, APIs, and data.
- **Contributing** defines how to change and verify the project.
- **Decisions** records consequential engineering choices and their trade-offs.

UI components and route files are linked from the relevant product or architecture note. They do
not define the top-level documentation hierarchy because those implementation details change more
frequently than the responsibilities they implement.

## Conventions

All maintained notes carry YAML frontmatter and follow the rules in the
[documentation style guide](contributing/documentation-style.md). Obsidian workspace settings are
personal and intentionally excluded from Git.
