import { normalizeEuroleaguePlayerCode } from '../../../api/euroleague/normalization';
import type { OfficialPlayerBoxScore, OfficialPlayerProfile } from '../../../api/euroleague/types';
import type { prepareOfficialMappingMutations } from '../../../db/mutations/official/mappings';

type OfficialMutations = ReturnType<typeof prepareOfficialMappingMutations>;

export function normalizeIdentity(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function similarity(left: string, right: string): number {
  const a = new Set(normalizeIdentity(left).split(' ').filter(Boolean));
  const b = new Set(normalizeIdentity(right).split(' ').filter(Boolean));
  const intersection = Array.from(a).filter((token) => b.has(token)).length;
  const union = new Set(Array.from(a).concat(Array.from(b))).size;
  return union ? intersection / union : 0;
}

export interface MappingIssue {
  kind: 'team' | 'player';
  providerCode: string;
  providerName: string;
  suggestion?: { id: number; name: string; score: number };
}

export async function reconcileTeamMappings(
  mutations: OfficialMutations,
  officialTeams: { code: string; name: string; crestUrl?: string | null; raw?: unknown }[]
): Promise<{ mapped: number; issues: MappingIssue[] }> {
  const fantasyTeams = await mutations.getFantasyTeams();
  const issues: MappingIssue[] = [];
  let mapped = 0;

  for (const official of officialTeams) {
    const byLegacyCode = fantasyTeams.filter((team) => team.code === official.code);
    const byExactName = fantasyTeams.filter(
      (team) => normalizeIdentity(team.name) === normalizeIdentity(official.name)
    );
    const candidates = byLegacyCode.length === 1 ? byLegacyCode : byExactName;

    if (candidates.length === 1) {
      await mutations.upsertTeamMapping({
        teamId: candidates[0].id,
        providerTeamCode: official.code,
        providerName: official.name,
        crestUrl: official.crestUrl,
        matchMethod: byLegacyCode.length === 1 ? 'legacy_code' : 'exact_name',
        confidence: 1,
        raw: official.raw,
      });
      mapped++;
      continue;
    }

    const ranked = fantasyTeams
      .map((team) => ({
        id: team.id,
        name: team.name,
        score: similarity(team.name, official.name),
      }))
      .sort((a, b) => b.score - a.score);
    issues.push({
      kind: 'team',
      providerCode: official.code,
      providerName: official.name,
      suggestion: ranked[0]?.score > 0 ? ranked[0] : undefined,
    });
  }

  return { mapped, issues };
}

export async function reconcilePlayerMappings(
  mutations: OfficialMutations,
  officialPlayers: (OfficialPlayerProfile | OfficialPlayerBoxScore)[]
): Promise<{ mapped: number; issues: MappingIssue[] }> {
  const fantasyPlayers = await mutations.getFantasyPlayers();
  const existing = await mutations.getPlayerMappings();
  const existingByCode = new Map(existing.map((row) => [row.provider_player_code, row] as const));
  const issues: MappingIssue[] = [];
  let mapped = 0;

  for (const official of officialPlayers) {
    const providerCode = normalizeEuroleaguePlayerCode(
      'playerCode' in official ? official.playerCode : ''
    );
    if (!providerCode) continue;
    const teamCode = 'teamCode' in official ? official.teamCode : null;
    const raw = official.raw;
    const persisted = existingByCode.get(providerCode);
    if (persisted?.status === 'ignored') continue;
    if (persisted?.status === 'matched') {
      await mutations.upsertPlayerMapping({
        playerId: persisted.player_id,
        providerPlayerCode: providerCode,
        providerName: official.playerName,
        providerTeamCode: teamCode,
        imageUrl: 'imageUrl' in official ? official.imageUrl : null,
        age: 'age' in official ? official.age : null,
        matchMethod: 'existing',
        confidence: 1,
        status: 'matched',
        raw,
      });
      mapped++;
      continue;
    }

    const byLegacyCode = fantasyPlayers.filter(
      (player) => normalizeEuroleaguePlayerCode(player.euroleague_code) === providerCode
    );
    const byExactTeamName = fantasyPlayers.filter(
      (player) =>
        player.provider_team_code === teamCode &&
        normalizeIdentity(player.name) === normalizeIdentity(official.playerName)
    );
    const candidates = byLegacyCode.length === 1 ? byLegacyCode : byExactTeamName;

    if (candidates.length === 1) {
      await mutations.upsertPlayerMapping({
        playerId: candidates[0].id,
        providerPlayerCode: providerCode,
        providerName: official.playerName,
        providerTeamCode: teamCode,
        imageUrl: 'imageUrl' in official ? official.imageUrl : null,
        age: 'age' in official ? official.age : null,
        matchMethod: byLegacyCode.length === 1 ? 'legacy_code' : 'exact_name_team',
        confidence: 1,
        status: 'matched',
        raw,
      });
      existingByCode.set(providerCode, {
        player_id: candidates[0].id,
        provider_player_code: providerCode,
        provider_team_code: teamCode,
        status: 'matched',
      });
      mapped++;
      continue;
    }

    await mutations.upsertPlayerMapping({
      playerId: null,
      providerPlayerCode: providerCode,
      providerName: official.playerName,
      providerTeamCode: teamCode,
      imageUrl: 'imageUrl' in official ? official.imageUrl : null,
      age: 'age' in official ? official.age : null,
      matchMethod: 'unresolved',
      confidence: 0,
      status: 'review_required',
      raw,
    });

    const ranked = fantasyPlayers
      .filter((player) => !teamCode || player.provider_team_code === teamCode)
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: similarity(player.name, official.playerName),
      }))
      .sort((a, b) => b.score - a.score);
    issues.push({
      kind: 'player',
      providerCode,
      providerName: official.playerName,
      suggestion: ranked[0]?.score > 0 ? ranked[0] : undefined,
    });
  }

  return { mapped, issues };
}
