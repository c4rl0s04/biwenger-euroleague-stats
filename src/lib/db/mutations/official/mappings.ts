import type { OfficialPlayerProfile } from '../../../api/euroleague/types';
import type { DbClient } from '../matches';
import { jsonPayload } from './shared';

export interface OfficialTeamMappingInput {
  teamId: number;
  providerTeamCode: string;
  providerName: string;
  crestUrl?: string | null;
  matchMethod: string;
  confidence: number;
  raw?: unknown;
}

export interface OfficialPlayerMappingInput {
  playerId: number | null;
  providerPlayerCode: string;
  providerName: string;
  providerTeamCode: string | null;
  imageUrl?: string | null;
  age?: number | null;
  matchMethod: string;
  confidence: number;
  status: 'matched' | 'review_required' | 'ignored';
  raw?: unknown;
}

export function prepareOfficialMappingMutations(db: DbClient, seasonId: string) {
  const upsertTeamMapping = async (mapping: OfficialTeamMappingInput) => {
    await db.query(
      `INSERT INTO official_team_mappings (
         season_id, team_id, provider, provider_team_code, provider_name, crest_url,
         match_method, confidence, raw_payload, updated_at
       ) VALUES ($1,$2,'euroleague_advanced',$3,$4,$5,$6,$7,$8::jsonb,NOW())
       ON CONFLICT (season_id, provider, provider_team_code) DO UPDATE SET
         team_id=EXCLUDED.team_id, provider_name=EXCLUDED.provider_name,
         crest_url=COALESCE(EXCLUDED.crest_url,official_team_mappings.crest_url),
         match_method=EXCLUDED.match_method, confidence=EXCLUDED.confidence,
         raw_payload=EXCLUDED.raw_payload, updated_at=NOW()`,
      [
        seasonId,
        mapping.teamId,
        mapping.providerTeamCode,
        mapping.providerName,
        mapping.crestUrl ?? null,
        mapping.matchMethod,
        mapping.confidence,
        jsonPayload(mapping.raw),
      ]
    );
  };

  const upsertPlayerMapping = async (mapping: OfficialPlayerMappingInput) => {
    await db.query(
      `INSERT INTO official_player_mappings (
         season_id, player_id, provider, provider_player_code, provider_name,
         provider_team_code, image_url, age, match_method, confidence, status,
         raw_payload, updated_at
       ) VALUES ($1,$2,'euroleague_advanced',$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,NOW())
       ON CONFLICT (season_id, provider, provider_player_code) DO UPDATE SET
         player_id=CASE
           WHEN official_player_mappings.status IN ('matched','ignored')
             THEN official_player_mappings.player_id ELSE EXCLUDED.player_id END,
         provider_name=EXCLUDED.provider_name,
         provider_team_code=EXCLUDED.provider_team_code,
         image_url=COALESCE(EXCLUDED.image_url,official_player_mappings.image_url),
         age=COALESCE(EXCLUDED.age,official_player_mappings.age),
         match_method=CASE
           WHEN official_player_mappings.status IN ('matched','ignored')
             THEN official_player_mappings.match_method ELSE EXCLUDED.match_method END,
         confidence=CASE
           WHEN official_player_mappings.status IN ('matched','ignored')
             THEN official_player_mappings.confidence ELSE EXCLUDED.confidence END,
         status=CASE
           WHEN official_player_mappings.status IN ('matched','ignored')
             THEN official_player_mappings.status ELSE EXCLUDED.status END,
         raw_payload=EXCLUDED.raw_payload, updated_at=NOW()`,
      [
        seasonId,
        mapping.playerId,
        mapping.providerPlayerCode,
        mapping.providerName,
        mapping.providerTeamCode,
        mapping.imageUrl ?? null,
        mapping.age ?? null,
        mapping.matchMethod,
        mapping.confidence,
        mapping.status,
        jsonPayload(mapping.raw),
      ]
    );
  };

  const getFantasyTeams = async () =>
    (
      await db.query(
        `SELECT DISTINCT t.id,t.name,t.code
         FROM teams t
         LEFT JOIN player_seasons ps ON ps.team_id=t.id AND ps.season_id=$1
         WHERE ps.id IS NOT NULL OR EXISTS (
           SELECT 1 FROM matches m
           WHERE m.season_id=$1 AND (m.home_id=t.id OR m.away_id=t.id)
         )`,
        [seasonId]
      )
    ).rows as { id: number; name: string; code: string | null }[];

  const getFantasyPlayers = async () =>
    (
      await db.query(
        `SELECT p.id,p.name,p.euroleague_code,ps.team_id,otm.provider_team_code
         FROM player_seasons ps
         JOIN players p ON p.id=ps.player_id
         LEFT JOIN official_team_mappings otm
           ON otm.season_id=ps.season_id AND otm.team_id=ps.team_id
          AND otm.provider='euroleague_advanced'
         WHERE ps.season_id=$1`,
        [seasonId]
      )
    ).rows as {
      id: number;
      name: string;
      euroleague_code: string | null;
      team_id: number | null;
      provider_team_code: string | null;
    }[];

  const getTeamMappings = async () =>
    (
      await db.query(
        `SELECT team_id,provider_team_code,provider_name
         FROM official_team_mappings
         WHERE season_id=$1 AND provider='euroleague_advanced'`,
        [seasonId]
      )
    ).rows as { team_id: number; provider_team_code: string; provider_name: string }[];

  const getPlayerMappings = async () =>
    (
      await db.query(
        `SELECT player_id,provider_player_code,provider_team_code,status
         FROM official_player_mappings
         WHERE season_id=$1 AND provider='euroleague_advanced'`,
        [seasonId]
      )
    ).rows as {
      player_id: number | null;
      provider_player_code: string;
      provider_team_code: string | null;
      status: string;
    }[];

  const storeProfiles = async (profiles: OfficialPlayerProfile[]) => {
    for (const profile of profiles) {
      await upsertPlayerMapping({
        playerId: null,
        providerPlayerCode: profile.playerCode,
        providerName: profile.playerName,
        providerTeamCode: profile.teamCode,
        imageUrl: profile.imageUrl,
        age: profile.age,
        matchMethod: 'unresolved',
        confidence: 0,
        status: 'review_required',
        raw: profile.raw,
      });
    }
  };

  return {
    upsertTeamMapping,
    upsertPlayerMapping,
    getFantasyTeams,
    getFantasyPlayers,
    getTeamMappings,
    getPlayerMappings,
    storeProfiles,
  };
}

export type OfficialMappingMutations = ReturnType<typeof prepareOfficialMappingMutations>;
