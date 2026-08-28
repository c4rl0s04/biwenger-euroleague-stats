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
