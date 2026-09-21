---
title: MapLibre attribution security upgrade
description: Scoped MapLibre dependency fix, worker packaging and verification evidence.
audience:
  - maintainer
  - contributor
status: active
---

# MapLibre attribution security upgrade

Base: `8bc0af22`. Branch: `fix/maplibre-attribution-security`.
This is a separately approved security prerequisite for Dashboard Task 06, not a feature migration.

## Finding and correction

The installed `maplibre-gl@5.20.1` is affected by
[GHSA-jrc7-96c5-q579](https://github.com/maplibre/maplibre-gl-js/security/advisories/GHSA-jrc7-96c5-q579).
Removing attributes from a live DOM collection skipped adjacent dangerous attributes. Our map
renders attribution from third-party CARTO styles, so the affected code is reachable; this does
not establish that CARTO supplied malicious content or that an exploit occurred.

Pin `6.4.1`, the first published patched release, in the manifest and lockfile. Only MapLibre's
dependency subtree changes. No forced audit remediation or unrelated package update is included.
Installation uses `npm ci --ignore-scripts --no-audit --no-fund`.

The [v6 migration guide](https://github.com/maplibre/maplibre-gl-js/blob/v6.0.0/docs/guides/v5-to-v6-migration-guide.md)
requires namespace/named imports and explicit worker setup with bundlers. Next's asset URL handling
emits a hashed worker but leaves its relative shared-module import unchanged. The preparation script
copies the installed worker, shared module, source maps and license verbatim into a versioned ignored
public directory. Build, development, worktree development, analysis and disposable browser-test
commands run preparation.
No CDN worker, dependency lifecycle scripts, authentication exception or deployment variable is added.
Generated dependency artifacts alone are excluded from application linting.

`zoomLevelsToOverscale: undefined` retains v5 overscaling. MapLibre 6 requires **WebGL2** and ES2022;
WebGL1-only browsers are no longer supported. The application does not use the removed internal
transform, missing-image resolver or legacy worker APIs. Layout, markers, controls and provider
configuration are otherwise unchanged.

## Verification evidence

- Unchanged baseline `npm run verify`: passed, including 2,278 tests and one existing skip.
- Browser regression against 5.20.1: failed as expected because the second event attribute survived.
- Identical regression against 6.4.1: passed all nine configured browser projects. It exercises the
  installed distribution with harmless consecutive event attributes and preserves a safe credit link.
- Worker preparation and manifest/lockfile/installation consistency tests: two passed.
- Both current CARTO styles validate against the installed style specification with no findings.
- Production dependency audit: zero findings. Full audit: five pre-existing moderate development
  findings (`drizzle-kit`, its esbuild chain and `@humanfs/node`); no high or critical findings.
  These unchanged development-tool findings are deferred outside this scoped upgrade; review them
  before the next dependency-maintenance release, no later than 2026-10-21.
- `npm run verify`: passed (2,280 tests, one existing skip; typecheck, architecture, documentation,
  skills, lint, database-disabled production build, schema metadata, Drizzle and whitespace checks).
  Lint retains the same 24 existing warnings and no errors. Schema and snapshot both contain 37 tables.
- `npm run test:e2e:local -- map-worker.spec.ts feature-screens.spec.ts`: 18 passed across all nine
  projects. Existing Matches/Teams screenshot baselines passed without replacement. The initial
  map test interrupted Safari prefetches by navigating away from Matches; logging in directly to
  the target map route fixed the test without changing application code or error guards.
- Both the candidate and unchanged baseline browser runs emitted `The destination stream closed early`
  during page teardown. This existing server-side disconnect log is not a new regression; browser
  exception and failed-API guards passed. Missing provider-variable warnings are expected in the
  deliberately credential-free disposable fixture.

The dedicated map-worker browser test supplies synthetic GeoJSON, requires actual worker messages,
checks worker errors, markers and zoom controls, and uses the unchanged browser/API error guard.
Existing Matches/Teams screenshots must pass without replacement. No production database or provider
mutation is used. Integration/push evidence will be reported separately; Vercel inspection is not
required by the user's current release workflow.
