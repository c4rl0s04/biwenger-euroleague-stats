---
title: Migration Browser Verification History
description: Screenshot provenance and acceptance details from the feature migration.
audience:
  - contributor
  - maintainer
status: deprecated
---

# Migration browser verification history

These notes preserve the migration-era provenance. See [Testing](../contributing/testing.md) for current instructions.

Manager Profile adds synthetic contributor, season and tournament facts, with semantic
checks across the configured viewports and 14 desktop/iPhone macOS snapshots captured
from the pre-migration implementation (`1a2c0c68`). Its Linux screenshot baseline is
still pending; Linux runs the semantic checks but must not initialize Profile snapshots
from migrated output. Existing Matches and Team Linux comparisons remain enabled.

Manager Profile checks desktop section redirects through the authenticated browser
context's request client, preserving its cookies and user-agent without repeatedly
replacing the live document. It requires an exact 307 destination or the pinned
Next.js streamed redirect error record, rejecting unrelated errors and unsupported
payloads. Negative checks exercise this fixture-specific assertion. Desktop UI and
screenshots remain on the live page; phone sections still use real navigation links.
No prefetch interception, browser-error filtering or snapshot updates are used to
avoid WebKit document-navigation cancellation.

The desktop Profile also brings its chart into view and waits for painted bars and
the two fixture score labels: Recharts' JavaScript animation is not settled by CSS
animation controls. Desktop captures use a resting pointer, an instant scroll reset
and document-coordinate clips for non-chart sections rather than locator auto-scrolling.
The SVG chart stays visible during its locator screenshot; chart tooltips
are tested separately. References come from the original implementation in that same
state, not an axes-only intermediate chart or accidental hover/header positioning.
The desktop overview captures the header/identity viewport; its five section images
cover the full domain content separately, avoiding unreliable offscreen SVG pixels
in a full-document overview. Phone overview captures remain full-page.

Rounds adds historical overview, court, history and comparison coverage, including
all four phone section links and the three desktop lineup modes. Nine macOS images
come from unchanged pre-migration application source at `9d06ee0c` (application
equivalent to `713d2a3b`). Original desktop/iPhone comparisons pass twice without
updating references. All nine viewports run semantic checks; Linux Rounds visual
references remain pending and must not be initialized from migrated output. These
tests use the existing synthetic league and unchanged browser/API error guards.

Visual comparisons use committed snapshots for supported platforms. Intentional appearance changes
require inspecting the output and updating baselines with `npm run test:e2e:update`; never update
snapshots solely to hide a regression. Browser failures retain screenshots and traces in
`test-results/`; CI uploads these artifacts for review. See the [design context](../product/design-system.md).

## Current reference maintenance

Task 26 reconciles desktop macOS references with the intentionally merged Task 23 shell.
The [acceptance receipt](./reports/task-26-regression-acceptance.md) distinguishes
those current-shell references from original pre-migration evidence retained in Git history.
The historical provenance notes below continue to identify the original source commits;
“unchanged” describes those original migration comparisons, not a ban on reviewed shell updates.
Phone references remain unchanged for the Task 26 background correction.

Affected captures use `waitForScreenshotPaint` to await fonts, finish finite entrance motion,
and wait two paint frames. This settles rendering before Playwright's existing strict comparison;
it does not hide text, change comparison thresholds or replace semantic assertions.
Both empty and populated Market scenarios include the repaired phone bids section.

## Test responsibilities

Home Task 09 adds desktop-hero and phone-timeline macOS references captured at unchanged `5174e9a0`.
Both passed a second original-source comparison before migration. Relative activity timestamps are
masked and the unrelated desktop News ticker receives an empty synthetic response; event content
remains visible. All nine projects check Home APIs, filters and existing composition. An isolated
iPhone case tests delayed loading, an expected HTTP failure, retry, cursor pagination, duplicate-ID
removal and filter snapshot restoration without weakening the shared browser error guards.
Linux runs semantic checks; Home Linux image references and production-data visual review remain
separate follow-ups.

News adds desktop/iPhone macOS references captured from unchanged `b7505a29`, with a second
original-source comparison before migration. Desktop uses a fixed synthetic ticker response and
freezes marquee motion; phone uses the real local feed and masks only the randomly selected headline.
Disclosure content/count and public API behavior are asserted separately. All nine projects exercise
News; the desktop negative case isolates expected loading/empty/failure behavior without changing
shared browser error guards. Navigation uses the real app link, avoiding forced-document reloads
that cancel WebKit prefetches. Linux runs semantic checks; News Linux image references remain pending.

Dashboard Task 07 adds twelve macOS references from unchanged `a5a44db0`: phone overview/five
sections and six desktop sections. The original implementation passed repeated comparisons before
migration. Captures wait for the squad-value JS spring to settle; only the randomized News headline
is masked. All nine projects check navigation and API contracts, while desktop/iPhone compare images.
The desktop statistics selector and phone News expander are exercised. A separate local browser page
delays a card request and injects an unsuccessful envelope/empty data to check skeletons and preserved
fallbacks; it asserts the exact expected synthetic console error rather than weakening normal guards.
Linux Dashboard screenshots and real-production-data visual review remain separate follow-ups.

Compare adds three macOS references (phone picker/detail and full desktop comparison) captured
from unchanged application source at `6aa275b6`. `compare.spec.ts` exercises authenticated
synthetic-data navigation and desktop rival selection across all nine viewports, preserving the
same browser/API error guards. Linux runs semantic checks without creating new visual references
from migrated output. Service and HTTP tests cover full/lite payloads, cookie/query independence,
headers, selection quirks, ranking formulas, failures and mapped-field allowlists.

Standings adds nine phone references (overview plus eight sections) and desktop ranking/progression
references captured from unchanged `38bf2de4` with the same synthetic fixture. The original passed
a second run without snapshot updates. Candidate comparisons must use these images unchanged.
Desktop assertions require both plotted lines and exercise manager filtering; screenshots do not
accept an axes-only chart. Like Rounds/Profile, these new references are macOS-specific; Linux runs
the semantic checks without creating new visual baselines from migrated output.
