import 'server-only';

import { getPlayerProfile, performGlobalSearch } from '@/lib/services';

type PlayerProfile = Awaited<ReturnType<typeof getPlayerProfile>>;

const MAX_CANDIDATES = 8;
const MAX_PLAYERS = 3;
const STOP_WORDS = new Set([
  'analiza',
  'analizar',
  'ayuda',
  'ayudame',
  'biwenger',
  'biwengerstats',
  'buscar',
  'compara',
  'comparar',
  'contra',
  'crees',
  'dame',
  'deberia',
  'debería',
  'del',
  'dime',
  'esta',
  'está',
  'fantasy',
  'jugador',
  'jugadores',
  'lineup',
  'mejor',
  'mercado',
  'opinas',
  'para',
  'precio',
  'puntos',
  'puedes',
  'quiero',
  'regularidad',
  'sobre',
  'stats',
  'tiene',
  'vender',
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f\s'-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addCandidate(candidates: string[], value: string) {
  const candidate = normalizeText(value);
  if (candidate.length < 3 || STOP_WORDS.has(candidate)) return;
  if (!candidates.includes(candidate)) candidates.push(candidate);
}

export function extractPlayerSearchCandidates(message: string): string[] {
  const candidates: string[] = [];
  const quotedValuePattern = /["“”'‘’]([^"“”'‘’]{3,60})["“”'‘’]/g;
  const capitalizedNamePattern =
    /\b[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]*){0,2}/g;
  let match: RegExpExecArray | null;

  while ((match = quotedValuePattern.exec(message)) !== null) {
    addCandidate(candidates, match[1]);
  }

  while ((match = capitalizedNamePattern.exec(message)) !== null) {
    addCandidate(candidates, match[0]);
  }

  const normalizedTokens = normalizeText(message)
    .split(' ')
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token) && Number.isNaN(Number(token)));

  for (const token of normalizedTokens) {
    addCandidate(candidates, token);
  }

  return candidates.slice(0, MAX_CANDIDATES);
}

function formatNumber(value: unknown): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? new Intl.NumberFormat('es-ES').format(numericValue)
    : 'N/D';
}

function formatDecimal(value: unknown): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : 'N/D';
}

function formatRecentMatches(profile: NonNullable<PlayerProfile>): string {
  const recentMatches = Array.isArray(profile.recentMatches)
    ? profile.recentMatches.slice(0, 5)
    : [];
  if (recentMatches.length === 0) return 'N/D';

  return recentMatches
    .map((match: any) => {
      const opponent =
        match.home_id === profile.team_id ? match.away_team : match.home_team || match.away_team;
      return `${match.round_name || `J${match.round_id}`}: ${formatDecimal(
        match.fantasy_points
      )} pts fantasy vs ${opponent || 'N/D'} (${formatDecimal(match.minutes_played)} min)`;
    })
    .join('; ');
}

function formatPlayerContext(profile: NonNullable<PlayerProfile>): string {
  const advancedStats = (profile as any).advancedStats || {};
  const nextMatch = (profile as any).nextMatch;

  return [
    `Jugador: ${(profile as any).name}`,
    `Equipo: ${(profile as any).team_name || 'N/D'}`,
    `Posición: ${(profile as any).position || 'N/D'}`,
    `Estado: ${(profile as any).status || 'N/D'}`,
    `Precio Biwenger: ${formatNumber((profile as any).price)}`,
    `Incremento de precio: ${formatNumber((profile as any).price_increment)}`,
    `Manager propietario: ${(profile as any).owner_name || 'Libre / N/D'}`,
    `Puntos fantasy totales: ${formatNumber((profile as any).total_points ?? (profile as any).puntos)}`,
    `Media fantasy temporada: ${formatDecimal((profile as any).season_avg)}`,
    `Partidos jugados: ${formatNumber((profile as any).player_total_matches ?? (profile as any).games_played)}`,
    `Últimos partidos: ${formatRecentMatches(profile)}`,
    `Próximo partido: ${
      nextMatch
        ? `${nextMatch.home_team || 'N/D'} vs ${nextMatch.away_team || 'N/D'} (${nextMatch.round_name || 'próxima jornada'})`
        : 'N/D'
    }`,
    `Promedio puntos reales: ${formatDecimal(advancedStats.avg_real_points)}`,
    `Promedio valoración: ${formatDecimal(advancedStats.avg_pir)}`,
  ].join('\n');
}

export async function buildPlayerContextForMessage(message: string): Promise<string | null> {
  const candidates = extractPlayerSearchCandidates(message);
  if (candidates.length === 0) return null;

  const playerIds = new Set<number>();

  for (const candidate of candidates) {
    const results = await performGlobalSearch(candidate);
    for (const player of results.players || []) {
      playerIds.add(Number(player.id));
      if (playerIds.size >= MAX_PLAYERS) break;
    }
    if (playerIds.size >= MAX_PLAYERS) break;
  }

  if (playerIds.size === 0) return null;

  const profiles = (
    await Promise.all(Array.from(playerIds).map((playerId) => getPlayerProfile(playerId)))
  ).filter(Boolean) as NonNullable<PlayerProfile>[];

  if (profiles.length === 0) return null;

  return profiles.map(formatPlayerContext).join('\n\n---\n\n');
}
