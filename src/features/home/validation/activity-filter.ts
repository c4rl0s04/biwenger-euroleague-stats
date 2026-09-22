import { HOME_ACTIVITY_FILTERS, type HomeActivityFilter } from '../models/contracts';

export function isHomeActivityFilter(value: unknown): value is HomeActivityFilter {
  return typeof value === 'string' && (HOME_ACTIVITY_FILTERS as readonly string[]).includes(value);
}

export function normalizeHomeActivityFilter(value: unknown): HomeActivityFilter | null {
  if (value === 'bonuses') return 'rounds';
  return isHomeActivityFilter(value) ? value : null;
}
