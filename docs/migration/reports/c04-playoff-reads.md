---
title: C04 Playoffs read migration
description: Source contracts and verification evidence for the Playoffs read boundary.
audience:
  - contributor
  - agent
status: active
---

# C04 Playoffs read migration

Baseline: 3c0517e2 on refactor/architecture-completion. IN PROGRESS; characterization only.
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
