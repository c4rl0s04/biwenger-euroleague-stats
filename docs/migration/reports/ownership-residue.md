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

## Review follow-up: date contract and offer projections

The review of `3cadaeb5` identified two bounded remaining items. Automatic lineup inputs now
accept Schedule's nullable dates; an explicit null-to-epoch conversion retains the previous
JavaScript ordering, and a compile-time test checks the actual Schedule public contract.

Lineup now owns the typed offer projection used by confirmation, cards, compact indicators,
tables and financial sorting. Existing purchase-price fallbacks, losses, one-decimal percentages
and the card/table distinction for missing market values are preserved. In particular, existing
NaN/Infinity percentage output is not normalized as part of this structural change.

Baseline focused tests: 29 passed. Updated focused tests: 42 passed. A deterministic comparison
of 729 price combinations against the pre-extraction card and table code matched exactly.
The desktop browser scenario uses synthetic offers and opens/cancels the confirmation without
submitting a provider command. Final verification results for this follow-up are recorded below.

Follow-up verification:

- `RAYON_NUM_THREADS=2 npm run verify`: passed, including 2,936 unit tests (eight existing skips),
  typecheck, architecture (1,071 modules / 125 protected entrypoints), documentation, lint
  (zero errors / 24 warnings), production build, offline schema checks and diff checks.
- `npm run test:e2e:local -- tests/e2e/schedule.spec.ts tests/e2e/lineup-ownership.spec.ts --project=iphone-13 --project=desktop-1440`:
  four passed and two expected viewport skips. The new desktop offer table/confirmation case
  passed; existing Schedule screenshots matched without updates. Disposable PostgreSQL
  integrity checks passed and the fixture cluster was stopped.
- The two review findings are addressed. Existing form-score and missing-price conventions
  remain behavior-preserving choices; integration and production acceptance remain separate.
