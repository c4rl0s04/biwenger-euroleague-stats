import type { PoolClient } from 'pg';
import type {
  OfficialGameMetadata,
  OfficialGameReport,
  OfficialPlayerBoxScore,
  OfficialPlayByPlayEvent,
  OfficialShot,
} from '../../../api/euroleague/types';
import type { DbClient } from '../matches';
import { jsonPayload, type Queryable } from './shared';

export interface OfficialGameDataInput {
  gameCode: number;
  roundId?: number;
  report: OfficialGameReport | null;
  metadata: OfficialGameMetadata | null;
  boxscore: OfficialPlayerBoxScore[];
  playByPlay: OfficialPlayByPlayEvent[];
  shots: OfficialShot[];
  checksum: string;
  finalized: boolean;
}

export function prepareOfficialGameMutations(db: DbClient, seasonId: string) {
  const updateGame = async (
    gameCode: number,
    report: OfficialGameReport | null,
    metadata: OfficialGameMetadata | null,
    checksum: string,
    client: Queryable = db
  ) => {
    const homeQuarters = metadata?.homeQuarterScores ?? [];
    const awayQuarters = metadata?.awayQuarterScores ?? [];
    const played = report?.isPlayed ?? false;
    const isLive = metadata?.isLive ?? false;
    const status = isLive ? 'live' : played ? 'finished' : 'scheduled';
    const homeScore = metadata?.homeScore ?? report?.homeScore ?? null;
    const awayScore = metadata?.awayScore ?? report?.awayScore ?? null;
    const homeQuartersSlice = homeQuarters.slice(0, 4);
    const awayQuartersSlice = awayQuarters.slice(0, 4);
    const homeHasAll4 = homeQuartersSlice.length === 4 && homeQuartersSlice.every((v) => v != null);
    const awayHasAll4 = awayQuartersSlice.length === 4 && awayQuartersSlice.every((v) => v != null);
    const homeRegtime = homeHasAll4
      ? homeQuartersSlice.reduce((sum, value) => (sum ?? 0) + (value ?? 0), 0)
      : null;
    const awayRegtime = awayHasAll4
      ? awayQuartersSlice.reduce((sum, value) => (sum ?? 0) + (value ?? 0), 0)
      : null;

    await client.query(
      `UPDATE matches SET
         status = $3,
         home_score = $4,
         away_score = $5,
         home_score_regtime = $6,
         away_score_regtime = $7,
         home_q1 = $8, away_q1 = $9,
         home_q2 = $10, away_q2 = $11,
         home_q3 = $12, away_q3 = $13,
         home_q4 = $14, away_q4 = $15,
         home_ot = $16, away_ot = $17,
         home_coach = $18, away_coach = $19,
         referee_1 = $20, referee_2 = $21, referee_3 = $22,
         payload_checksum = $23,
         date = COALESCE($24, date),
         arena_name = COALESCE($25, matches.arena_name),
         arena_capacity = COALESCE($26, matches.arena_capacity)
       WHERE season_id = $1 AND official_game_code = $2`,
      [
        seasonId,
        gameCode,
        status,
        homeScore,
        awayScore,
        homeRegtime,
        awayRegtime,
        homeQuarters[0] ?? null,
        awayQuarters[0] ?? null,
        homeQuarters[1] ?? null,
        awayQuarters[1] ?? null,
        homeQuarters[2] ?? null,
        awayQuarters[2] ?? null,
        homeQuarters[3] ?? null,
        awayQuarters[3] ?? null,
        metadata?.homeOvertime ?? null,
        metadata?.awayOvertime ?? null,
        metadata?.homeCoach ?? null,
        metadata?.awayCoach ?? null,
        metadata?.referees?.[0] ?? null,
        metadata?.referees?.[1] ?? null,
        metadata?.referees?.[2] ?? null,
        checksum,
        report?.scheduledAt ?? null,
        metadata?.arenaName ?? null,
        metadata?.arenaCapacity ?? null,
      ]
    );
    return status;
  };

  const upsertPlay = async (event: OfficialPlayByPlayEvent, client: Queryable) => {
    await client.query(
      `INSERT INTO official_play_by_play (
         season_id,game_code,sequence,provider_play_number,period,minute,marker_time,play_type,
         team_code,provider_player_code,player_name,team_name,dorsal,home_score,away_score,
         comment,play_info,raw_payload,synced_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,NOW())
       ON CONFLICT (season_id,game_code,sequence) DO UPDATE SET
         provider_play_number=EXCLUDED.provider_play_number,period=EXCLUDED.period,
         minute=EXCLUDED.minute,marker_time=EXCLUDED.marker_time,play_type=EXCLUDED.play_type,
         team_code=EXCLUDED.team_code,provider_player_code=EXCLUDED.provider_player_code,
         player_name=EXCLUDED.player_name,team_name=EXCLUDED.team_name,dorsal=EXCLUDED.dorsal,
         home_score=EXCLUDED.home_score,away_score=EXCLUDED.away_score,comment=EXCLUDED.comment,
         play_info=EXCLUDED.play_info,raw_payload=EXCLUDED.raw_payload,synced_at=NOW()`,
      [
        seasonId,
        event.gameCode,
        event.sequence,
        event.providerPlayNumber,
        event.period,
        event.minute,
        event.markerTime,
        event.playType,
        event.teamCode,
        event.playerCode,
        event.playerName,
        event.teamName,
        event.dorsal,
        event.homeScore,
        event.awayScore,
        event.comment,
        event.playInfo,
        jsonPayload(event.raw),
      ]
    );
  };

  const upsertShot = async (shot: OfficialShot, client: Queryable) => {
    await client.query(
      `INSERT INTO official_shots (
         season_id,game_code,annotation_number,team_code,provider_player_code,player_name,
         action_id,action,points,coordinate_x,coordinate_y,zone,is_fastbreak,is_second_chance,
         is_points_off_turnover,minute,marker_time,home_score,away_score,occurred_at,raw_payload,synced_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21::jsonb,NOW())
       ON CONFLICT (season_id,game_code,annotation_number) DO UPDATE SET
         team_code=EXCLUDED.team_code,provider_player_code=EXCLUDED.provider_player_code,
         player_name=EXCLUDED.player_name,action_id=EXCLUDED.action_id,action=EXCLUDED.action,
         points=EXCLUDED.points,coordinate_x=EXCLUDED.coordinate_x,coordinate_y=EXCLUDED.coordinate_y,
         zone=EXCLUDED.zone,is_fastbreak=EXCLUDED.is_fastbreak,is_second_chance=EXCLUDED.is_second_chance,
         is_points_off_turnover=EXCLUDED.is_points_off_turnover,minute=EXCLUDED.minute,
         marker_time=EXCLUDED.marker_time,home_score=EXCLUDED.home_score,away_score=EXCLUDED.away_score,
         occurred_at=EXCLUDED.occurred_at,raw_payload=EXCLUDED.raw_payload,synced_at=NOW()`,
      [
        seasonId,
        shot.gameCode,
        shot.annotationNumber,
        shot.teamCode,
        shot.playerCode,
        shot.playerName,
        shot.actionId,
        shot.action,
        shot.points,
        shot.coordinateX,
        shot.coordinateY,
        shot.zone,
        shot.isFastbreak,
        shot.isSecondChance,
        shot.isPointsOffTurnover,
        shot.minute,
        shot.markerTime,
        shot.homeScore,
        shot.awayScore,
        shot.occurredAt,
        jsonPayload(shot.raw),
      ]
    );
  };

  const persistGameData = async (input: OfficialGameDataInput) => {
    const pool = db as DbClient & { connect?: () => Promise<PoolClient> };
    const client = pool.connect ? await pool.connect() : null;
    const target = (client ?? db) as Queryable;
    try {
      if (client) await client.query('BEGIN');
      const status = await updateGame(
        input.gameCode,
        input.report,
        input.metadata,
        input.checksum,
        target
      );
      if (input.finalized) {
        await target.query(
          'DELETE FROM official_play_by_play WHERE season_id=$1 AND game_code=$2',
          [seasonId, input.gameCode]
        );
        await target.query('DELETE FROM official_shots WHERE season_id=$1 AND game_code=$2', [
          seasonId,
          input.gameCode,
        ]);
      }

      // Upsert player sporting boxscore rows directly into player_round_stats
      if (input.boxscore.length > 0) {
        let roundId = input.roundId;
        if (!roundId) {
          const matchRes = await target.query(
            'SELECT round_id FROM matches WHERE season_id=$1 AND official_game_code=$2',
            [seasonId, input.gameCode]
          );
          roundId = matchRes.rows[0]?.round_id;
        }

        if (roundId) {
          const mapRes = await target.query(
            `SELECT provider_player_code, player_id FROM official_player_mappings
             WHERE season_id=$1 AND provider='euroleague_advanced' AND status='matched' AND player_id IS NOT NULL`,
            [seasonId]
          );
          const playerMap = new Map<string, number>(
            mapRes.rows.map((row: any) => [row.provider_player_code, row.player_id])
          );

          for (const stat of input.boxscore) {
            const playerId = playerMap.get(stat.playerCode);
            if (!playerId) continue;

            await target.query(
              `INSERT INTO player_round_stats (
                 season_id, player_id, round_id,
                 minutes, minutes_seconds, dorsal, points,
                 two_points_made, two_points_attempted,
                 three_points_made, three_points_attempted,
                 free_throws_made, free_throws_attempted,
                 rebounds, offensive_rebounds, defensive_rebounds,
                 assists, steals, blocks, blocks_against,
                 turnovers, fouls_committed, fouls_received,
                 valuation, plus_minus, games_started, is_dnp, official_game_code, raw_payload
               ) VALUES (
                 $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                 $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29::jsonb
               )
               ON CONFLICT (season_id, player_id, round_id) DO UPDATE SET
                 minutes = EXCLUDED.minutes,
                 minutes_seconds = EXCLUDED.minutes_seconds,
                 dorsal = COALESCE(EXCLUDED.dorsal, player_round_stats.dorsal),
                 points = EXCLUDED.points,
                 two_points_made = EXCLUDED.two_points_made,
                 two_points_attempted = EXCLUDED.two_points_attempted,
                 three_points_made = EXCLUDED.three_points_made,
                 three_points_attempted = EXCLUDED.three_points_attempted,
                 free_throws_made = EXCLUDED.free_throws_made,
                 free_throws_attempted = EXCLUDED.free_throws_attempted,
                 rebounds = EXCLUDED.rebounds,
                 offensive_rebounds = EXCLUDED.offensive_rebounds,
                 defensive_rebounds = EXCLUDED.defensive_rebounds,
                 assists = EXCLUDED.assists,
                 steals = EXCLUDED.steals,
                 blocks = EXCLUDED.blocks,
                 blocks_against = EXCLUDED.blocks_against,
                 turnovers = EXCLUDED.turnovers,
                 fouls_committed = EXCLUDED.fouls_committed,
                 fouls_received = EXCLUDED.fouls_received,
                 valuation = EXCLUDED.valuation,
                 plus_minus = EXCLUDED.plus_minus,
                 games_started = EXCLUDED.games_started,
                 is_dnp = EXCLUDED.is_dnp,
                 official_game_code = COALESCE(EXCLUDED.official_game_code, player_round_stats.official_game_code),
                 raw_payload = EXCLUDED.raw_payload`,
              [
                seasonId,
                playerId,
                roundId,
                stat.minutesSeconds != null ? Math.round(stat.minutesSeconds / 60) : null,
                stat.minutesSeconds,
                stat.dorsal,
                stat.points,
                stat.twoPointsMade,
                stat.twoPointsAttempted,
                stat.threePointsMade,
                stat.threePointsAttempted,
                stat.freeThrowsMade,
                stat.freeThrowsAttempted,
                stat.totalRebounds,
                stat.offensiveRebounds,
                stat.defensiveRebounds,
                stat.assists,
                stat.steals,
                stat.blocks,
                stat.blocksAgainst,
                stat.turnovers,
                stat.foulsCommitted,
                stat.foulsReceived,
                stat.valuation,
                stat.plusMinus,
                stat.isStarter == null ? null : stat.isStarter ? 1 : 0,
                stat.isDnp != null ? stat.isDnp : null,
                input.gameCode,
                jsonPayload(stat.raw),
              ]
            );
          }
        }
      }

      for (const row of input.playByPlay) await upsertPlay(row, target);
      for (const row of input.shots) await upsertShot(row, target);
      if (client) await client.query('COMMIT');
      return status;
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      throw error;
    } finally {
      client?.release();
    }
  };

  const materializeRoundStats = async (_roundId: number) => {
    // Round stats are now populated directly during persistGameData
  };

  const getSyncCandidates = async (forceGame?: number) =>
    (
      await db.query(
        `SELECT m.official_game_code AS game_code,
                m.date AS scheduled_at,
                m.status,
                m.payload_checksum,
                m.round_id,
                m.round_name
         FROM matches m
         WHERE m.season_id = $1
           AND m.official_game_code IS NOT NULL
           AND ($2::int IS NOT NULL AND m.official_game_code = $2 OR $2::int IS NULL AND (
             m.date BETWEEN NOW() - INTERVAL '48 hours' AND NOW() + INTERVAL '1 hour'
             OR m.status = 'live'
             OR m.payload_checksum IS NULL AND m.date < NOW()
           ))
         ORDER BY m.date`,
        [seasonId, forceGame ?? null]
      )
    ).rows as {
      game_code: number;
      scheduled_at: Date | null;
      status: string;
      finalized_at: Date | null;
      payload_checksum: string | null;
      round_id: number;
      round_name: string;
    }[];

  const getGameByMatchId = async (matchId: number) =>
    (
      await db.query(
        `SELECT m.id, m.official_game_code, m.status, m.date
         FROM matches m
         WHERE m.id = $1 AND m.season_id = $2`,
        [matchId, seasonId]
      )
    ).rows[0] as
      | {
          id: number;
          official_game_code: number | null;
          status: string;
          date: Date;
          finalized_at: Date | null;
        }
      | undefined;

  const hasUnpersistedMappedPlayers = async (
    roundId: number,
    playerCodes: string[]
  ): Promise<boolean> => {
    if (playerCodes.length === 0) return false;
    const res = await db.query(
      `SELECT 1
       FROM official_player_mappings m
       LEFT JOIN player_round_stats prs
         ON prs.season_id = m.season_id
        AND prs.player_id = m.player_id
        AND prs.round_id = $2
       WHERE m.season_id = $1
         AND m.provider = 'euroleague_advanced'
         AND m.status = 'matched'
         AND m.player_id IS NOT NULL
         AND m.provider_player_code = ANY($3)
         AND (prs.id IS NULL OR prs.official_game_code IS NULL)
       LIMIT 1`,
      [seasonId, roundId, playerCodes]
    );
    return res.rows.length > 0;
  };

  return {
    updateGame,
    persistGameData,
    materializeRoundStats,
    getSyncCandidates,
    getGameByMatchId,
    hasUnpersistedMappedPlayers,
  };
}
