export type ScheduleSearchParams = { [key: string]: string | string[] | undefined };
/** Preserve JS parseInt coercion (including arrays, hex and numeric prefixes). */
export function parseScheduleRoundId(value: string | string[] | undefined): number | null {
  return value ? parseInt(String(value)) : null;
}
