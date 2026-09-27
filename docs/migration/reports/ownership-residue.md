---
title: Ownership residue follow-up
description: Bounded cleanup of Lineup rules, Hoopgrid CLI persistence and stale documentation links.
audience:
  - contributor
  - maintainer
status: active
---

# Ownership residue follow-up

Base: main `016d2488`. Branch: `refactor/ownership-residue`.
Worktree: `../biwengerstats-next-ownership-residue`.

## Baseline and scope

The preceding read-only audit passed architecture checking (1,067 modules, 125 protected
entrypoints), found no retired-helper runtime consumers, and identified four broken links
in main CI. Documentation linked directories removed by the previous migration. Existing
local empty directories had hidden this from filesystem-based link checks; this fresh
worktree contains no such directories.

This follow-up moves automatic starter/bench/captain selection, swap eligibility/ranking,
squad ownership/listing/offer enrichment and squad-table form calculation behind Lineup's
client-safe contract. Existing rendering, HTTP requests, errors and command payloads remain.
The squad-table form calculation intentionally retains its existing unknown-score behavior
(`?` produces NaN, sorted as zero); aligning it with competition form is a separate behavior
change, not part of this ownership refactor.

Hoopgrid's repository now owns the latest-challenge query, including inactive challenges.
Its command service owns the next-date decision, preserving local date increment behavior
and the current-time fallback. The CLI retains argument handling, output and generation loop.
No generator, provider mutation, production database operation or schema change is performed.

The standard graph includes `scripts/hoopgrid` and rejects persistence/deep feature imports
from that domain CLI. Other operational infrastructure scripts retain their existing scope.
Inventory classifications distinguish these adapters from generic infrastructure and
explicitly record that legacy presentation requires semantic review: import checks alone
cannot prove that inline domain rules are absent.

## Validation

- Baseline evidence: preceding audit and failing main CI documentation step.
- `npm run test:run -- src/features/lineup src/features/hoopgrid scripts/architecture --maxWorkers=2`:
  81 passed before the additional repository test.
- A deterministic Node comparison against the original `016d2488` AutoAlignButton algorithm:
  500 automatic-lineup results/errors matched exactly.
- `RAYON_NUM_THREADS=2 npm run verify`: skills, architecture (1,070 modules / 125 protected
  entrypoints), documentation, typecheck and full unit suite passed: 2,923 tests, eight existing
  skips. Lint passed with zero errors and 24 warnings. The database-disabled production build, schema
  metadata audit, Drizzle consistency check and diff check all passed.
- The first full suite identified a stale whole-file hash for AutoAlignButton. Its intentional
  extraction is now verified by contract and domain behavior tests; unchanged preview and HTTP
  adapter hashes remain. The second full suite passed.
- `npm run test:e2e:local -- tests/e2e/schedule.spec.ts tests/e2e/lineup-ownership.spec.ts --project=iphone-13 --project=desktop-1440`:
  three passed, one expected desktop skip for the mobile-only Lineup section. Schedule desktop,
  phone and map screenshots matched existing references without updates. The harness's disposable
  PostgreSQL multi-season integrity checks also passed; its cluster was stopped afterward.
- Browser coverage is limited to these affected existing scenarios; automatic selection and
  desktop squad enrichment/ranking are verified by pure domain tests, not live provider writes.

Integration, exact-merge CI and deployment acceptance remain subsequent steps. No claim of
Task 27 or production acceptance is made by this receipt.
