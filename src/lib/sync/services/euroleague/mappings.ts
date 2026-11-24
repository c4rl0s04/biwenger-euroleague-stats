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
  reason?: string;
  suggestion?: { id: number; name: string; score: number };
}

export async function reconcileTeamMappings(
  mutations: OfficialMutations,
  officialTeams: { code: string; name: string; crestUrl?: string | null; raw?: unknown }[],
  preview = false
) {
  const fantasyTeams = await mutations.getFantasyTeams();
  const issues: MappingIssue[] = [];
  const assignments = new Map<string, number>();

  for (const official of officialTeams) {
    const byLegacyCode = fantasyTeams.filter((team) => team.code === official.code);
    const byExactName = fantasyTeams.filter(
      (team) => normalizeIdentity(team.name) === normalizeIdentity(official.name)
    );
    const candidates = byLegacyCode.length === 1 ? byLegacyCode : byExactName;

    if (candidates.length === 1) {
      assignments.set(official.code, candidates[0].id);
      if (!preview) {
        await mutations.upsertTeamMapping({
          teamId: candidates[0].id,
          providerTeamCode: official.code,
          providerName: official.name,
          crestUrl: official.crestUrl,
          matchMethod: byLegacyCode.length === 1 ? 'legacy_code' : 'exact_name',
          confidence: 1,
          raw: official.raw,
        });
      }
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

  return { mapped: assignments.size, issues, assignments };
}

type FantasyPlayer = Awaited<ReturnType<OfficialMutations['getFantasyPlayers']>>[number];
type StoredMapping = Awaited<ReturnType<OfficialMutations['getPlayerMappings']>>[number];
type OfficialPlayer = OfficialPlayerProfile | OfficialPlayerBoxScore;

function playerCode(value: string | null): string {
  const code = value?.trim().toUpperCase() ?? '';
  return /^P[A-Z]+$/.test(code) ? code : normalizeEuroleaguePlayerCode(code);
}

function officialNames(value: string) {
  const parts = value.split(',');
  const surname = parts.length === 2 && parts[1].trim() ? normalizeIdentity(parts[0]) : '';
  const fullName = normalizeIdentity(value);
  return {
    fullName,
    surname,
    reordered: surname ? normalizeIdentity(parts.reverse().join(' ')) : '',
  };
}

export function planPlayerMappings(
  fantasyPlayers: FantasyPlayer[],
  existing: StoredMapping[],
  officialPlayers: OfficialPlayer[],
  allowSurname: boolean
) {
  const existingByCode = new Map(existing.map((row) => [row.provider_player_code, row]));
  const owners = new Map(existing.map((row) => [row.player_id, row.provider_player_code]));
  const catalogue = new Map<string, OfficialPlayer>();
  const conflictingCodes = new Set<string>();
  const surnamesByTeam = new Map<string, Set<string>>();
  for (const official of officialPlayers) {
    const code = playerCode(official.playerCode);
    if (!code) continue;
    const previous = catalogue.get(code);
    if (!previous) catalogue.set(code, official);
    else if (
      previous.teamCode !== official.teamCode ||
      previous.playerName !== official.playerName
    ) {
      conflictingCodes.add(code);
    }
    const { surname } = officialNames(official.playerName);
    if (allowSurname && official.teamCode && surname) {
      const key = `${official.teamCode}:${surname}`;
      const codes = surnamesByTeam.get(key) ?? new Set<string>();
      codes.add(code);
      surnamesByTeam.set(key, codes);
    }
  }

  const proposals = Array.from(catalogue, ([providerCode, official]) => {
    const persisted = existingByCode.get(providerCode);
    const { fullName, surname, reordered } = officialNames(official.playerName);
    const sameTeam = fantasyPlayers.filter(
      (player) => official.teamCode && player.provider_team_code === official.teamCode
    );
    let reason = 'No exact match';
    let method = 'unresolved';
    let playerId: number | null = null;
    if (persisted?.status === 'ignored') return null;
    if (persisted?.status === 'matched') {
      return { providerCode, official, playerId: persisted.player_id, method: 'existing', reason };
    }
    const byCode = fantasyPlayers.filter(
      (player) => playerCode(player.euroleague_code) === providerCode
    );
    const byName = sameTeam.filter((player) => {
      const name = normalizeIdentity(player.name);
      return name && (name === fullName || name === reordered);
    });
    const bySurname =
      allowSurname && surname
        ? sameTeam.filter((player) => normalizeIdentity(player.name) === surname)
        : [];
    const candidates = byCode.length ? byCode : byName.length ? byName : bySurname;
    const candidate = candidates[0];
    if (conflictingCodes.has(providerCode)) reason = 'Conflicting official profiles';
    else if (candidates.length > 1) reason = 'Multiple Biwenger candidates';
    else if (candidate) {
      const storedCode = playerCode(candidate.euroleague_code);
      const owner = owners.get(candidate.id);
      if (
        (candidate.euroleague_code && storedCode !== providerCode) ||
        (owner && owner !== providerCode)
      ) {
        reason = 'Candidate already has a different official code or link';
      } else if (
        !byCode.length &&
        !byName.length &&
        surnamesByTeam.get(`${official.teamCode}:${surname}`)?.size !== 1
      ) {
        reason = 'Surname is shared in the official team catalogue';
      } else {
        playerId = candidate.id;
        method = byCode.length
          ? 'legacy_code'
          : byName.length
            ? 'exact_name_team'
            : 'exact_surname_team';
      }
    } else if (!official.teamCode || !sameTeam.length)
      reason = 'Missing mapped team or Biwenger roster';
    return { providerCode, official, playerId, method, reason };
  }).filter((proposal) => proposal !== null);

  const claims = new Map<number, number>();
  for (const { playerId, method } of proposals) {
    if (playerId !== null && method !== 'existing') {
      claims.set(playerId, (claims.get(playerId) ?? 0) + 1);
    }
  }
  return proposals.map((proposal) => {
    if (proposal.playerId !== null && (claims.get(proposal.playerId) ?? 0) > 1) {
      return {
        ...proposal,
        playerId: null,
        method: 'unresolved',
        reason: 'Multiple official codes claim this player',
      };
    }
    return proposal;
  });
}

export async function reconcilePlayerMappings(
  mutations: OfficialMutations,
  officialPlayers: OfficialPlayer[],
  options: { allowSurname?: boolean; preview?: boolean; teams?: Map<number, string> } = {}
) {
  const [players, existing] = await Promise.all([
    mutations.getFantasyPlayers(),
    mutations.getPlayerMappings(),
  ]);
  // The preview uses the same team assignments the full step would persist.
  const fantasyPlayers = options.teams
    ? players.map((player) => ({
        ...player,
        provider_team_code:
          player.team_id === null ? null : (options.teams?.get(player.team_id) ?? null),
      }))
    : players;
  const proposals = planPlayerMappings(
    fantasyPlayers,
    existing,
    officialPlayers,
    options.allowSurname ?? false
  );
  const issues: MappingIssue[] = [];
  const decisions = [];
  let mapped = 0;
  for (const { providerCode, official, playerId, method, reason } of proposals) {
    const status = method === 'existing' || playerId !== null ? 'matched' : 'review_required';
    if (!options.preview) {
      await mutations.upsertPlayerMapping({
        playerId,
        providerPlayerCode: providerCode,
        providerName: official.playerName,
        providerTeamCode: official.teamCode,
        imageUrl: 'imageUrl' in official ? official.imageUrl : null,
        age: 'age' in official ? official.age : null,
        matchMethod: method,
        confidence: status === 'matched' ? 1 : 0,
        status,
        raw: official.raw,
      });
    }
    if (method !== 'existing') {
      decisions.push({
        providerCode,
        playerId,
        teamCode: official.teamCode,
        name: official.playerName,
        method,
        reason,
      });
    }
    if (status === 'matched') {
      mapped++;
      continue;
    }
    const suggestion = fantasyPlayers
      .filter((player) => !official.teamCode || player.provider_team_code === official.teamCode)
      .map((player) => ({
        id: player.id,
        name: player.name,
        score: similarity(player.name, official.playerName),
      }))
      .sort((a, b) => b.score - a.score || a.id - b.id)[0];
    issues.push({
      kind: 'player',
      providerCode,
      providerName: official.playerName,
      reason,
      suggestion: suggestion?.score > 0 ? suggestion : undefined,
    });
  }

  return { mapped, issues, decisions };
}
