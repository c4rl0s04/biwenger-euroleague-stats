export interface BiwengerRound {
  id: number;
  name: string;
  status?: string;
  [key: string]: unknown;
}

export function normalizeRoundName(name: string | undefined): string {
  if (!name) return '';
  return name
    .replace(/\s*\(aplazada\)\s*/i, '')
    .replace(/\s*Playoff\s*/i, '')
    .replace(/\s*Eliminatoria\s*/i, 'Eliminatoria')
    .replace(/\s*Final Four\s*/i, 'Final Four')
    .trim();
}

export function isCompetitionRound(round: BiwengerRound): boolean {
  return /Jornada|Playoff|Final Four|Eliminatoria|Play-In/i.test(round.name || '');
}

export function canonicalRoundIds(rounds: BiwengerRound[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const round of [...rounds].sort((left, right) => left.id - right.id)) {
    const normalized = normalizeRoundName(round.name);
    if (!result.has(normalized) || round.id < result.get(normalized)!) {
      result.set(normalized, round.id);
    }
  }
  return result;
}

export function resolveRoundId(
  round: Pick<BiwengerRound, 'id' | 'name'>,
  roundIds: Map<string, number>
): number {
  const normalized = normalizeRoundName(round.name);
  if (normalized.includes('Jornada') && roundIds.has(normalized)) {
    return roundIds.get(normalized)!;
  }
  return round.id;
}

export function relevantRounds(rounds: BiwengerRound[]): BiwengerRound[] {
  let eliminationIndex = 1;
  return [...rounds]
    .sort((left, right) => left.id - right.id)
    .filter(isCompetitionRound)
    .map((round) => {
      const normalized = normalizeRoundName(round.name);
      return {
        ...round,
        name: normalized === 'Eliminatoria' ? `Eliminatoria ${eliminationIndex++}` : normalized,
      };
    });
}
