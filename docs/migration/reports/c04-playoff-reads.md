---
title: C04 Playoffs read migration
description: Source contracts and verification evidence for the Playoffs read boundary.
audience:
  - contributor
  - agent
status: active
---

# C04 Playoffs read migration

Baseline: 3c0517e2 on refactor/architecture-completion. IMPLEMENTED AND LOCALLY VERIFIED.
Unmerged and undeployed; campaign-wide viewport/Linux closure remains C14. Historical checkpoints follow.
Previous complete source verification: 1531 passing tests, one skip; Predictions browser acceptance
passed desktop/iPhone with unchanged references. Do not repeat that entire baseline before each edit.

## Routes and exact flow

- /playoffs: getPlayoffLeaderboard and phone detection start together. Phone returns immediately;
  only desktop then fetches all teams. Page revalidate is 600; no service memoization exists.
- /playoffs/predictions/[userId]: requireMobileRoute runs first, then the complete leaderboard is
  fetched. Exact string identity comparison selects the user; missing users render null, not a new 404.
  The mobile registry retains desktop redirect and path validation. Do not parse IDs as integers.
- No dedicated Playoffs HTTP route, Server Action or interactive write was found in either screen.
- Only these two pages consume playoffService. getPlayoffResults has no source consumer; confirm
  scripts/tests and dynamic imports again before removing it. SCORING_RULES is internal scoring policy.

The legacy service resolves the season once, then sequentially reads active seasonal users,
playoff_predictions, playoff_results and user_playoff_media. It calculates scores in memory and
sorts descending points with stable ties. Desktop teams currently come from an unfiltered table read.
The client uses only team ID/name for winner lookup; a narrow Teams server contract should own that
catalogue, preserving its unfiltered scope and ordering. No shared directory query should be copied.

## Compatibility pinned

- Weights: play-in 1, quarter 3, semi 6, final 10. Ordinary unknown stages score zero.
- Correct counts include a completed correct prediction even when its stage awards zero points.
- Accuracy denominator includes completed predictions only; no completed predictions yields zero.
- Pending/missing results produce isCorrect null; missing winner/score remain undefined.
- Result matching uses matchId alone and the first matching row, not stage plus matchId.
- User matching is strict; textual IDs keep leading zeros. Input order breaks score ties.
- Completed null winner and null predicted winner currently compare equal; do not silently repair it.
- Existing optional media and nullable names must survive mapping. Raw record spreads, Date values
  and any[] presentation models need explicit projections, not a fabricated schema change.
- Phone prediction detail currently renders generic MobileRecordList rows and its first-20 limit.
  Preserve labels and output while replacing the database-shaped input with typed rows.

Five original-service characterization tests pass: weights/denominators, ties/no predictions,
strict identity, null winners/first result, and season-error propagation before database access.

## Ownership and frozen writes

src/lib/sync/playoffs/sync.ts reads its JSON artifact, resolves names against teams, and upserts
prediction/result records under the existing writable-season guard. It is not called by the pages.
Retain it unchanged for C12/C11e review. Never run this script or a provider operation for validation.
No authentication, credential, schema, cache-policy, dependency or production changes are authorized.

## Next implementation and acceptance

Create feature-owned records, query adapters, scoring/mappers, read/screen services and typed models.
Move the two existing screens and thin both pages; retain metadata, early phone return and route guards.
Expose client-safe public.ts and server-only server.ts, register both pages in architecture policy,
and remove obsolete service/component paths only after consumer verification.
Capture populated original desktop/phone fixtures before presentation changes. Add mapper/service/page
and boundary tests; run full verification and original-reference browser comparisons before acceptance.
The campaign-wide Linux/full viewport and release gates remain C14/C15, not implicitly complete here.

## Backend ownership checkpoint

features/playoffs now owns the four-read query, scoring/projection mapper, typed database facts,
explicit serializable leaderboard/prediction models and uncached service. The legacy service delegates
leaderboard reads; its team/results helpers remain temporarily until their final consumer audit.
The same five original-service tests pass through the new boundary. Nullable SQL names are modeled
honestly; the existing detail-page context uses an erased non-null assertion to preserve runtime output.
Prediction rows are allowlisted and their unused createdAt timestamp is serialized to ISO; UI consumers
do not read that field. No score, ID coercion, query order, season scope or cache policy was changed.
Typecheck passed after extraction. Final mapper/boundary tests, Teams catalogue ownership, original
screen fixtures, presentation migration and full acceptance remain outstanding. This is not C04 acceptance.

The mapper now has explicit allowlisting/ISO timestamp regression coverage. Teams owns the narrow
getTeamNames contract: unchanged unfiltered table query, no new ordering/cache/season policy, output
restricted to nullable name and ID consumed by Playoffs. The old getPlayoffResults export had no
remaining consumers and is removed; the remaining legacy service is only a temporary re-export adapter.
Typecheck, architecture (842 modules/50 entrypoints), and 23 focused Teams/Playoffs tests passed.
Presentation, populated original browser references and full acceptance still remain.

## Screen-service preparation

Typed overview/detail services preserve concurrent phone detection and leaderboard reads, no team
lookup on phone, exact textual identity and null missing-user output. Detail projections retain
MobileRecordList's first-20 generic labels and stored points. Typecheck and five feature-local tests
passed; these services are not yet wired into the pages.

Original-reference worktree: chore/playoffs-visual-baseline at 49bd8334. Its new disposable browser
test covers overview, phone detail and desktop image/no-image states with test-scoped rows.
The first capture exposed an incorrect test back-link label (the actual context is Fixture Manager).
That assertion was corrected without application changes. The interrupted runner left its disposable
cluster running; that exact loopback fixture was stopped with pg_ctl. No production database was touched.
The corrected original-reference run is in progress; screenshots are not yet accepted references.

## Screen migration and browser evidence

Both pages now call feature screen services and compose public feature components. The overview is
TSX; its 600-second declaration remains. Detail guards still run before reads and missing users still
render null. Mobile overview and prediction rows use explicit models rather than Record<string, any>.
The desktop component uses typed leaderboard/prediction and Teams name models; its emitted JavaScript
is identical to original 49bd8334. Existing local generic UI casts are retained pending the C13 controls
typing pass; they do not define the feature data contract. No CSS or interaction implementation changed.

Removed the obsolete global service and desktop/phone component paths after consumer searches.
Characterization tests moved into the feature; both pages are registered in architecture enforcement.
Typecheck and architecture passed (844 modules, 52 entrypoints); all fifteen focused feature tests pass,
including page guards, exact IDs, null missing states, model projection and service read order.

Corrected original capture passed (31.7s); repeat without snapshot updates passed (38.4s).
Original references are retained at fc053343 on the baseline branch. The migrated desktop/iPhone run
passed (31.7s), preserving all five original screenshots, phone detail and desktop image/no-image
interactions. The desktop media reference was visually inspected. Browser error guards stayed unchanged
and each completed runner stopped its disposable database. Full source verification is next.
Campaign-wide Linux/full viewport and release gates remain C14/C15, not implied by this focused run.

## Local acceptance

npm run verify passed: skills, architecture (844 modules/52 entrypoints), docs, typecheck,
1554 tests plus one existing skip, lint (zero errors/24 existing image warnings), database-disabled
production build, schema metadata (38 tables/no drift), Drizzle consistency and git diff --check.
Expected absent-provider build notices remain unchanged. Combined with the original/candidate browser
comparisons above, this accepts C04 locally; it does not close campaign-wide C14/C15 requirements.
The legacy service and presentation paths are removed, and their tests retained inside the feature.
No provider writes, production data, authentication, schema, secrets or dependency changes were made.
Next regular slice: C05 public Market analytics, separate from private Market actions.
