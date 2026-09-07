---
title: Worker report template
description: Compact handoff without copying conversation history.
audience:
  - agent
  - maintainer
status: active
---

# Worker report template

Copy into the report path named by the assignment; retain required YAML frontmatter.

## Identity

- Batch:
- Status: IMPLEMENTING / BLOCKED / READY_FOR_REVIEW
- Branch and absolute worktree:
- Exact starting SHA:
- Source commit SHAs:
- Instruction-pack branch/commit:
- Working tree clean:

## Inventory before edits

Route/section/API -> service -> query/table -> screen, including other consumers.
For each HTTP route record identity source, input quirks, response/error envelope,
status codes, exact headers, framework dynamic/revalidation and server-cache policy.

## Implementation

Bounded services/models/components created; query ownership; moved/deleted files;
retained adapters and their consumers; deliberate cross-feature contracts.
List preserved formula and presentation quirks and any decisions requiring review.

## Verification

| Command                            | Baseline result | Candidate result |
| ---------------------------------- | --------------- | ---------------- |
| Typecheck                          | Not run         | Not run          |
| Architecture                       | Not run         | Not run          |
| Working and full-range diff checks | Not run         | Not run          |

List focused tests authored, any tests actually run, and full validation deferred to reviewer.
Do not substitute historical predecessor results for candidate validation.

## Risks and handoff

Blockers, unverified visuals/platforms, remaining scope, suggested focused test commands.
Confirm no prohibited changes, external operations or other batch started.
Final status: implemented — awaiting independent verification (only when implementation is finished).
