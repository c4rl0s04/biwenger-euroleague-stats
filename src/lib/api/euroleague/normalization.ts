import type { EuroleagueRow } from './schemas';

export const asString = (value: unknown): string | null =>
  value === null || value === undefined || value === '' ? null : String(value).trim();

export const asBoolean = (value: unknown): boolean =>
  value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';

export const requiredString = (row: EuroleagueRow, key: string): string => {
  const value = asString(row[key]);
  if (!value) throw new Error(`EuroLeague API row is missing ${key}.`);
  return value;
};

export function normalizeEuroleaguePlayerCode(value: unknown): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? `P${digits.padStart(6, '0')}` : '';
}

export function euroleagueSeasonYear(seasonCode: string, seasonId: string): number {
  const match = /^E(\d{4})$/.exec(seasonCode);
  if (!match) throw new Error(`Invalid EuroLeague season code: ${seasonCode}`);

  const year = Number(match[1]);
  if (!seasonId.startsWith(`${year}-`)) {
    throw new Error(
      `EuroLeague season ${seasonCode} does not match application season ${seasonId}.`
    );
  }
  return year;
}
