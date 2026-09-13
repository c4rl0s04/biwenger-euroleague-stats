import 'server-only';
import { readPlayerFormRows, resolvePlayerFormSeason } from '../queries/player-form.query';
import { mapPlayerForm } from '../mappers/player-form.mapper';

/** Shared finished-team-match projection; no identity lookup, persistence or new cache. */
export const PLAYER_FORM_POLICY = Object.freeze({
  access: 'public-statistics',
  cache: 'none',
  season: 'configured-read-season',
} as const);

/** Trusted internal window is preserved, not newly clamped or validated here.
 * The lookup stays server-side; screen services expose their existing plain projections. */
export async function getPlayerFormMap(limit = 5) {
  const seasonId = await resolvePlayerFormSeason();
  return mapPlayerForm(await readPlayerFormRows(limit, seasonId), limit);
}
