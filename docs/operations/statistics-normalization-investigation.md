# Provider-independent statistics: investigation and proposed contract

Status: proposed, not implemented. Date: 2026-09-13. Source code inspected on main at 354f66e1; data inspected in the isolated season_audit copy. No live provider requests, production changes or application edits.

## Objective

One domain read contract per granularity, independent of season/provider. Provider adapters own translation. Storage preserves canonical units, provenance and missingness. Services never select a different implementation merely because the requested season is old. Presentation renders unavailable values deliberately instead of converting them to zero.

## Evidence

- The copy contains 8,767 historical player-round records. Fantasy points are present in all records. The common sporting fields below each have 293 null values, leaving 8,474 populated values.
- Six advanced fields are null in all 8,767 rows: offensive_rebounds, defensive_rebounds, fouls_received, blocks_against, plus_minus, games_started. No absence of source capability is inferred from stored nulls alone.
- New official game and player-game tables are empty in this snapshot. Legacy round records cannot currently be regenerated from them.
- src/lib/api/euroleague/client.ts: getPlayerBoxScore maps missing/invalid numeric values through asNumber(...) ?? 0. minutesToSeconds maps null and DNP to zero and tolerates malformed components. quarters also defaults missing cumulative values to zero.
- src/lib/api/euroleague/types.ts models most box-score metrics and minutesSeconds as non-null numbers despite optional provider fields in schemas.ts.
- src/lib/db/mutations/official/game-data.ts: materializeRoundStats sums game statistics and rounds total seconds back to integer minutes. SUM ignores nulls, so nullable ingestion alone will not establish complete aggregates.
- src/features/players/server/mappers/player.mapper.ts: toNumber converts null to zero; the match mapper applies it to minutes and sporting statistics. Derived appearance counts use truthiness of minutes.
- The archive/euroleague-legacy-2025-26 tag is not a sufficient record of the original ingestion behavior by itself: its stats service already contains the newer materialization flow. Earlier revision tracing is required before asserting legacy minute rounding or zero-fill semantics.

## Field ownership and mapping

Names below describe the canonical contract; existing HTTP names must be preserved through adapters or deliberately changed with approval.

| Canonical round field | Existing historical field | New box-score input | Rule |
| --- | --- | --- | --- |
| fantasy_points | fantasy_points | Separate Biwenger score ingestion | Never derive from basketball points or PIR. |
| minutes_seconds | minutes (integer) | Minutes -> minutesSeconds | Legacy minutes * 60 is minute-resolution, not recovered exact duration. Keep precision/provenance. |
| points | points | Points | Nullable basketball points. |
| two_points_made / attempted | same | FieldGoalsMade2 / FieldGoalsAttempted2 | Nullable counts. |
| three_points_made / attempted | same | FieldGoalsMade3 / FieldGoalsAttempted3 | Nullable counts. |
| free_throws_made / attempted | same | FreeThrowsMade / FreeThrowsAttempted | Nullable counts. |
| rebounds | rebounds | TotalRebounds | Do not substitute a partial component sum. |
| offensive_rebounds / defensive_rebounds | same, all null | OffensiveRebounds / DefensiveRebounds | Historical unavailable. |
| assists | assists | Assistances | Nullable count. |
| steals | steals | Steals | Nullable count. |
| blocks | blocks | BlocksFavour | Blocks made, not blocks received. |
| blocks_against | same, all null | BlocksAgainst | Historical unavailable. |
| turnovers | turnovers | Turnovers | Nullable count. |
| fouls_committed | fouls_committed | FoulsCommited | Nullable count; retain provider spelling only in adapter. |
| fouls_received | same, all null | FoulsReceived | Historical unavailable. |
| valuation | valuation | Valuation | Sporting valuation/PIR; verify provider formula equivalence before calling cross-source values identical. |
| plus_minus | same, all null | Plusminus | Signed value; historical unavailable. |
| games_started | same, all null | IsStarter | Count known starts across games; unknown flag is not false. |

Identity, fantasy seasonal state and source mappings retain the responsibilities in season-data-audit.md and the agreed table design. This investigation does not authorize deleting legacy mappings or statistical summaries.

## Availability contract

Proposed metric metadata: status = available | partial | unavailable; reason when needed (not_recorded, pending, invalid_source, incomplete_coverage, unresolved_mapping); precision for durations (second or minute); provenance distinguishes imported observations and derived aggregates.

- Store numeric NULL for unknown values, never the display string "unavailable".
- Preserve a measured zero. Do not retrospectively convert old zeros to null without evidence.
- Do not use one availability flag for the entire row: fantasy points may be known while sporting data is missing.
- Missing data for a scheduled game is pending, not necessarily unsupported.
- A documented DNP represents known non-participation, distinct from a missing box score. Define metric behavior explicitly; do not infer DNP from null minutes.
- A partial observed sum may be retained separately, but the normal total must not appear as complete. Track expected/observed coverage where knowable; legacy coverage can be unknown.
- Reject or quarantine malformed source values with safe metadata; absence and invalid input are different conditions.
- Percentages/per-minute rates use defined denominators and adequate coverage. A zero denominator is not a zero percentage by default.

Storage mechanism for per-metric/group metadata remains a design decision: a typed JSONB availability/provenance document on the round projection is a candidate, not a finalized schema. Avoid a separate row per scalar metric unless demonstrated requirements justify it. No generic EAV redesign is proposed.

## Grain and source separation

1. Source-specific official tables remain ingestion evidence; raw payloads are server-only.
2. Player round statistics remain the shared canonical round projection for either source.
3. Game details remain a separate contract. Do not fabricate games from a round total.
4. Season summaries use explicitly defined round/game/phase coverage. Preserve imported provider totals separately where definitions differ; the 54 existing mismatches are unresolved.
5. Cross-game team identity comes from game or membership evidence, not a player's current team.

Proposed services: getPlayerRoundStats({playerId, seasonId}), getPlayerGameStats({playerId, seasonId}), getPlayerSeasonSummary({playerId, seasonId}). These represent contracts, not new REST endpoints. They return stable typed models and availability metadata. No season-specific provider branching in pages. Cache keys include season and relevant inputs; existing access policies remain unchanged.

## Required implementation changes after architecture integration

- Nullable provider DTO metrics; validated minutes parsing; preserve absent fields through adapters and writes.
- Exact seconds retained in canonical duration storage; mark legacy resolution without asserting rounding direction.
- Coverage-aware aggregators, including incomplete mappings and multiple games per round.
- Null-preserving query/mapping/model contracts and explicit display handling. This is a deliberate behavior correction, not a structural-only refactor.
- No global seasonal fallback and no silent GREATEST-based replacement of authoritative corrections.
- Tests: observed zero vs missing vs invalid; DNP vs missing; signed metrics; exact and legacy duration; multiple games; partial fields; missing mapping; late provider correction; 2025-26 unavailable advanced stats; two-season cache isolation; unchanged authorization.

## Outstanding investigation

Trace original ingestion revisions for legacy precision/defaults; reconcile the 54 total mismatches and six missing identities; compare embedded lineups; profile other table families' availability; verify actual new-provider contract documentation or redacted fixtures before finalizing parser semantics. No live provider capabilities are claimed solely from the current client code.
