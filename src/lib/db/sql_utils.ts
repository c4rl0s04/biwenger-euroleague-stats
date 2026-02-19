/**
 * Shared SQL Logic for standardized behavior across the app
 */

// 1. Next Round Logic (Lockout Style)
// Find the earliest round where the *first match* hasn't started yet.
export const NEXT_ROUND_CTE = `
  WITH NextRoundStart AS (
    SELECT round_id, MIN(date) as start_time
    FROM matches
    GROUP BY round_id
    HAVING MIN(date) > NOW()
    ORDER BY start_time ASC
    LIMIT 1
  )
`;

// 2. Future Match Condition
// Robust comparison using datetime() to handle ISO8601 strings vs 'now'
// Usage: WHERE ${FUTURE_MATCH_CONDITION('m.date')}
export const FUTURE_MATCH_CONDITION = (column: string = 'date'): string => `${column} > NOW()`;
