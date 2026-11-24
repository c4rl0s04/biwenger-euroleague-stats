import { z } from 'zod';

const regionNames = new Intl.DisplayNames('en', { type: 'region', fallback: 'none' });
const dateSchema = z.iso.date();

export function parseBiwengerDate(value: unknown): string | null {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const compact = String(value);
  if (!/^\d{8}$/.test(compact)) return null;
  const date = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6)}`;
  return dateSchema.safeParse(date).success ? date : null;
}

function positiveInteger(value: unknown): number | null {
  const number = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value) : value;
  return typeof number === 'number' && Number.isInteger(number) && number > 0 && number < 300
    ? number
    : null;
}

export function parseBiwengerPlayerBiography(response: unknown, playerId: number) {
  const data = (response as { data?: Record<string, unknown> } | null)?.data;
  if (
    !data ||
    (typeof data.id !== 'number' && typeof data.id !== 'string') ||
    Number(data.id) !== playerId
  ) {
    return null;
  }
  const region = typeof data.country === 'string' ? data.country.trim().toUpperCase() : '';
  const country =
    /^[A-Z]{2}$/.test(region) && region !== 'ZZ' ? (regionNames.of(region) ?? null) : null;
  const birth_date = parseBiwengerDate(data.birthday);
  const height = positiveInteger(data.height);
  const weight = positiveInteger(data.weight);
  return country || birth_date || height || weight
    ? { id: playerId, country, birth_date, height, weight }
    : null;
}
