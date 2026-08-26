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
