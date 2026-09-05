import type { PlayerCatalogueSection } from '../models/player-catalogue';
import type { PlayerProfileSection } from '../models/player-profile';

// Compatibility note: the legacy Player query used Number(value) plus isNaN.
// This intentionally preserves accepted forms such as "07" and "1e2".
export function parsePlayerId(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parsePlayerCatalogueSection(value: unknown): PlayerCatalogueSection | null {
  return value === 'insights' || value === 'squads' ? value : null;
}

export function parsePlayerProfileSection(value: unknown): PlayerProfileSection | null {
  return value === 'performance' || value === 'market' || value === 'history' ? value : null;
}

export function parsePlayerCatalogueFilters(searchParams: unknown): {
  query: string;
  position: string;
} {
  const params = (searchParams || {}) as { q?: unknown; position?: unknown };
  return {
    query: String(params.q ?? '').trim(),
    position: String(params.position ?? '').trim(),
  };
}
