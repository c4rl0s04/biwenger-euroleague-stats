import type { TeamProfileSection } from '../models/team-profile';

export function parseTeamId(value: unknown): number | null {
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseTeamProfileSection(value: unknown): TeamProfileSection | null {
  return value === 'roster' || value === 'matches' ? value : null;
}
