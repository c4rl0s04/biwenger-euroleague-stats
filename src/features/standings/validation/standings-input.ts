import type { StandingsOptions } from '../models/base-standings';

/** Preserve first-value URL semantics, empty sort and case-sensitive direction fallback. */
export function parseStandingsSearchParams(searchParams: URLSearchParams): StandingsOptions {
  const sortBy = searchParams.get('sort') ?? 'total_points';
  const direction = searchParams.get('dir') ?? 'desc';
  return { sortBy, direction: direction === 'asc' || direction === 'desc' ? direction : 'desc' };
}
