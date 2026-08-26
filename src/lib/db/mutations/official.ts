import type { PoolClient } from 'pg';
import type {
  OfficialGameMetadata,
  OfficialGameReport,
  OfficialPlayerBoxScore,
  OfficialPlayerProfile,
  OfficialPlayByPlayEvent,
  OfficialScheduleGame,
  OfficialShot,
  OfficialStanding,
} from '../../api/official-provider';
import type { DbClient } from './matches';

interface Queryable {
  query: (sql: string, params?: any[]) => Promise<any>;
}

const json = (value: unknown) => JSON.stringify(value ?? null);

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

export function prepareOfficialMutations(db: DbClient, seasonId: string) {
  const upsertScheduleGame = async (game: OfficialScheduleGame, client: Queryable = db) => {
    await client.query(
      `
        INSERT INTO official_games (
          season_id, provider, game_code, game_id, round_number, round_code, phase,
          home_team_code, away_team_code, scheduled_at, is_date_confirmed,
          is_time_confirmed, is_played, status, arena_code, arena_name, arena_capacity,
          raw_schedule, synced_at
        ) VALUES (
          $1, 'euroleague_advanced', $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17::jsonb, NOW()
        )
        ON CONFLICT (season_id, provider, game_code) DO UPDATE SET
          game_id = EXCLUDED.game_id,
          round_number = EXCLUDED.round_number,
          round_code = EXCLUDED.round_code,
          phase = EXCLUDED.phase,
          home_team_code = EXCLUDED.home_team_code,
          away_team_code = EXCLUDED.away_team_code,
          scheduled_at = EXCLUDED.scheduled_at,
          is_date_confirmed = EXCLUDED.is_date_confirmed,
          is_time_confirmed = EXCLUDED.is_time_confirmed,
          is_played = EXCLUDED.is_played,
          status = CASE
            WHEN official_games.status IN ('live', 'finished') THEN official_games.status
            WHEN EXCLUDED.is_played THEN 'finished'
            ELSE 'scheduled'
          END,
          arena_code = EXCLUDED.arena_code,
          arena_name = COALESCE(EXCLUDED.arena_name, official_games.arena_name),
          arena_capacity = COALESCE(EXCLUDED.arena_capacity, official_games.arena_capacity),
          raw_schedule = EXCLUDED.raw_schedule,
          synced_at = NOW()
      `,
      [
        seasonId,
        game.gameCode,
        game.gameId,
        game.roundNumber,
        game.roundCode,
        game.phase,
        game.homeTeamCode,
        game.awayTeamCode,
        game.scheduledAt,
        game.isDateConfirmed,
        game.isTimeConfirmed,
        game.isPlayed,
        game.isPlayed ? 'finished' : 'scheduled',
        game.arenaCode,
        game.arenaName,
        game.arenaCapacity,
        json(game.raw),
      ]
    );
  };

  const upsertStanding = async (standing: OfficialStanding) => {
    await db.query(
      `
        INSERT INTO official_team_standings (
          season_id, round_number, team_code, position, games_played, games_won,
          games_lost, points_for, points_against, raw_payload, synced_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,NOW())
        ON CONFLICT (season_id, round_number, team_code) DO UPDATE SET
          position=EXCLUDED.position, games_played=EXCLUDED.games_played,
          games_won=EXCLUDED.games_won, games_lost=EXCLUDED.games_lost,
          points_for=EXCLUDED.points_for, points_against=EXCLUDED.points_against,
          raw_payload=EXCLUDED.raw_payload, synced_at=NOW()
      `,
      [
        seasonId,
        standing.roundNumber,
        standing.teamCode,
        standing.position,
        standing.gamesPlayed,
        standing.gamesWon,
        standing.gamesLost,
        standing.pointsFor,
        standing.pointsAgainst,
        json(standing.raw),
      ]
    );
  };

  const upsertTeamMapping = async (mapping: OfficialTeamMappingInput) => {
    await db.query(
      `
        INSERT INTO official_team_mappings (
          season_id, team_id, provider, provider_team_code, provider_name, crest_url,
          match_method, confidence, raw_payload, updated_at
        ) VALUES ($1,$2,'euroleague_advanced',$3,$4,$5,$6,$7,$8::jsonb,NOW())
        ON CONFLICT (season_id, provider, provider_team_code) DO UPDATE SET
          team_id=EXCLUDED.team_id, provider_name=EXCLUDED.provider_name,
          crest_url=COALESCE(EXCLUDED.crest_url, official_team_mappings.crest_url),
          match_method=EXCLUDED.match_method, confidence=EXCLUDED.confidence,
          raw_payload=EXCLUDED.raw_payload, updated_at=NOW()
      `,
      [
        seasonId,
        mapping.teamId,
        mapping.providerTeamCode,
        mapping.providerName,
        mapping.crestUrl ?? null,
        mapping.matchMethod,
        mapping.confidence,
        json(mapping.raw),
      ]
    );
  };

  const upsertPlayerMapping = async (mapping: OfficialPlayerMappingInput) => {
    await db.query(
      `
        INSERT INTO official_player_mappings (
          season_id, player_id, provider, provider_player_code, provider_name,
          provider_team_code, image_url, age, match_method, confidence, status,
          raw_payload, updated_at
        ) VALUES ($1,$2,'euroleague_advanced',$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,NOW())
        ON CONFLICT (season_id, provider, provider_player_code) DO UPDATE SET
          player_id=CASE
            WHEN official_player_mappings.status IN ('matched','ignored')
              THEN official_player_mappings.player_id
            ELSE EXCLUDED.player_id
          END,
          provider_name=EXCLUDED.provider_name,
          provider_team_code=EXCLUDED.provider_team_code,
          image_url=COALESCE(EXCLUDED.image_url, official_player_mappings.image_url),
          age=COALESCE(EXCLUDED.age, official_player_mappings.age),
          match_method=CASE
            WHEN official_player_mappings.status IN ('matched','ignored')
              THEN official_player_mappings.match_method
            ELSE EXCLUDED.match_method
          END,
          confidence=CASE
            WHEN official_player_mappings.status IN ('matched','ignored')
              THEN official_player_mappings.confidence
            ELSE EXCLUDED.confidence
          END,
          status=CASE
            WHEN official_player_mappings.status IN ('matched','ignored')
              THEN official_player_mappings.status
            ELSE EXCLUDED.status
          END,
          raw_payload=EXCLUDED.raw_payload,
          updated_at=NOW()
      `,
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
        json(mapping.raw),
      ]
    );
  };

  const getFantasyTeams = async () =>
    (
      await db.query(
        `SELECT DISTINCT t.id, t.name, t.code
         FROM teams t
         LEFT JOIN player_seasons ps ON ps.team_id = t.id AND ps.season_id = $1
         WHERE ps.id IS NOT NULL OR EXISTS (
           SELECT 1 FROM matches m
           WHERE m.season_id = $1 AND (m.home_id = t.id OR m.away_id = t.id)
         )`,
        [seasonId]
      )
    ).rows as { id: number; name: string; code: string | null }[];

  const getFantasyPlayers = async () =>
    (
      await db.query(
        `SELECT p.id, p.name, p.euroleague_code, ps.team_id,
                otm.provider_team_code
         FROM player_seasons ps
         JOIN players p ON p.id = ps.player_id
         LEFT JOIN official_team_mappings otm
           ON otm.season_id = ps.season_id AND otm.team_id = ps.team_id
          AND otm.provider = 'euroleague_advanced'
         WHERE ps.season_id = $1`,
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
        `SELECT team_id, provider_team_code, provider_name
         FROM official_team_mappings
         WHERE season_id=$1 AND provider='euroleague_advanced'`,
        [seasonId]
      )
    ).rows as { team_id: number; provider_team_code: string; provider_name: string }[];

  const getPlayerMappings = async () =>
    (
      await db.query(
        `SELECT player_id, provider_player_code, provider_team_code, status
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

  const upsertGameDetails = async (
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
    const homeRegtime = homeQuarters.slice(0, 4).reduce((sum, value) => sum + value, 0) || null;
    const awayRegtime = awayQuarters.slice(0, 4).reduce((sum, value) => sum + value, 0) || null;

    await client.query(
      `
        UPDATE official_games SET
          round_number=COALESCE($3,round_number), phase=COALESCE($4,phase),
          scheduled_at=COALESCE($5,scheduled_at), is_played=$6, is_live=$7, status=$8,
          home_score=$9, away_score=$10, home_score_regtime=$11, away_score_regtime=$12,
          home_q1=$13, away_q1=$14, home_q2=$15, away_q2=$16,
          home_q3=$17, away_q3=$18, home_q4=$19, away_q4=$20,
          home_ot=$21, away_ot=$22, arena_name=COALESCE($23,arena_name),
          arena_capacity=COALESCE($24,arena_capacity), home_coach=$25, away_coach=$26,
          referee_1=$27, referee_2=$28, referee_3=$29,
          payload_checksum=$30, raw_report=$31::jsonb, raw_metadata=$32::jsonb,
          synced_at=NOW()
        WHERE season_id=$1 AND provider='euroleague_advanced' AND game_code=$2
      `,
      [
        seasonId,
        gameCode,
        report?.roundNumber ?? null,
        report?.phase ?? null,
        report?.scheduledAt ?? null,
        played,
        isLive,
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
        metadata?.arenaName ?? null,
        metadata?.arenaCapacity ?? null,
        metadata?.homeCoach ?? null,
        metadata?.awayCoach ?? null,
        metadata?.referees[0] ?? null,
        metadata?.referees[1] ?? null,
        metadata?.referees[2] ?? null,
        checksum,
        json(report?.raw),
        json(metadata?.raw),
      ]
    );

    await client.query(
      `UPDATE matches m SET
         date=og.scheduled_at, status=og.status,
         home_score=og.home_score, away_score=og.away_score,
         home_score_regtime=og.home_score_regtime, away_score_regtime=og.away_score_regtime,
         home_q1=og.home_q1, away_q1=og.away_q1, home_q2=og.home_q2, away_q2=og.away_q2,
         home_q3=og.home_q3, away_q3=og.away_q3, home_q4=og.home_q4, away_q4=og.away_q4,
         home_ot=og.home_ot, away_ot=og.away_ot
       FROM official_games og
       WHERE m.season_id=$1 AND m.official_game_code=$2
         AND og.season_id=m.season_id AND og.game_code=m.official_game_code
         AND og.provider='euroleague_advanced'`,
      [seasonId, gameCode]
    );

    return status;
  };

  const upsertPlayerStat = async (stat: OfficialPlayerBoxScore, client: Queryable) => {
    await client.query(
      `INSERT INTO official_player_game_stats (
         season_id,game_code,provider_player_code,provider_name,team_code,is_home,is_starter,
         is_playing,dorsal,minutes,minutes_seconds,points,two_points_made,two_points_attempted,
         three_points_made,three_points_attempted,free_throws_made,free_throws_attempted,
         offensive_rebounds,defensive_rebounds,total_rebounds,assists,steals,turnovers,blocks,
         blocks_against,fouls_committed,fouls_received,valuation,plus_minus,raw_payload,synced_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
         $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31::jsonb,NOW())
       ON CONFLICT (season_id,game_code,provider_player_code) DO UPDATE SET
         provider_name=EXCLUDED.provider_name,team_code=EXCLUDED.team_code,is_home=EXCLUDED.is_home,
         is_starter=EXCLUDED.is_starter,is_playing=EXCLUDED.is_playing,dorsal=EXCLUDED.dorsal,
         minutes=EXCLUDED.minutes,minutes_seconds=EXCLUDED.minutes_seconds,points=EXCLUDED.points,
         two_points_made=EXCLUDED.two_points_made,two_points_attempted=EXCLUDED.two_points_attempted,
         three_points_made=EXCLUDED.three_points_made,three_points_attempted=EXCLUDED.three_points_attempted,
         free_throws_made=EXCLUDED.free_throws_made,free_throws_attempted=EXCLUDED.free_throws_attempted,
         offensive_rebounds=EXCLUDED.offensive_rebounds,defensive_rebounds=EXCLUDED.defensive_rebounds,
         total_rebounds=EXCLUDED.total_rebounds,assists=EXCLUDED.assists,steals=EXCLUDED.steals,
         turnovers=EXCLUDED.turnovers,blocks=EXCLUDED.blocks,blocks_against=EXCLUDED.blocks_against,
         fouls_committed=EXCLUDED.fouls_committed,fouls_received=EXCLUDED.fouls_received,
         valuation=EXCLUDED.valuation,plus_minus=EXCLUDED.plus_minus,raw_payload=EXCLUDED.raw_payload,
         synced_at=NOW()`,
      [
        seasonId,
        stat.gameCode,
        stat.playerCode,
        stat.playerName,
        stat.teamCode,
        stat.isHome,
        stat.isStarter,
        stat.isPlaying,
        stat.dorsal,
        stat.minutes,
        stat.minutesSeconds,
        stat.points,
        stat.twoPointsMade,
        stat.twoPointsAttempted,
        stat.threePointsMade,
        stat.threePointsAttempted,
        stat.freeThrowsMade,
        stat.freeThrowsAttempted,
        stat.offensiveRebounds,
        stat.defensiveRebounds,
        stat.totalRebounds,
        stat.assists,
        stat.steals,
        stat.turnovers,
        stat.blocks,
        stat.blocksAgainst,
        stat.foulsCommitted,
        stat.foulsReceived,
        stat.valuation,
        stat.plusMinus,
        json(stat.raw),
      ]
    );
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
        json(event.raw),
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
        json(shot.raw),
      ]
    );
  };

  const persistGameData = async (input: {
    gameCode: number;
    report: OfficialGameReport | null;
    metadata: OfficialGameMetadata | null;
    boxscore: OfficialPlayerBoxScore[];
    playByPlay: OfficialPlayByPlayEvent[];
    shots: OfficialShot[];
    checksum: string;
    finalized: boolean;
  }) => {
    const pool = db as DbClient & { connect?: () => Promise<PoolClient> };
    const client = pool.connect ? await pool.connect() : null;
    const target = (client ?? db) as Queryable;
    try {
      if (client) await client.query('BEGIN');
      const status = await upsertGameDetails(
        input.gameCode,
        input.report,
        input.metadata,
        input.checksum,
        target
      );
      if (input.finalized) {
        await target.query(
          'DELETE FROM official_player_game_stats WHERE season_id=$1 AND game_code=$2',
          [seasonId, input.gameCode]
        );
        await target.query(
          'DELETE FROM official_play_by_play WHERE season_id=$1 AND game_code=$2',
          [seasonId, input.gameCode]
        );
        await target.query('DELETE FROM official_shots WHERE season_id=$1 AND game_code=$2', [
          seasonId,
          input.gameCode,
        ]);
      }
      for (const row of input.boxscore) await upsertPlayerStat(row, target);
      for (const row of input.playByPlay) await upsertPlay(row, target);
      for (const row of input.shots) await upsertShot(row, target);
      if (input.finalized) {
        await target.query(
          `UPDATE official_games SET finalized_at=COALESCE(finalized_at,NOW())
           WHERE season_id=$1 AND provider='euroleague_advanced' AND game_code=$2`,
          [seasonId, input.gameCode]
        );
      }
      if (client) await client.query('COMMIT');
      return status;
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      throw error;
    } finally {
      client?.release();
    }
  };

  const materializeRoundStats = async (roundId: number) => {
    await db.query(
      `INSERT INTO player_round_stats (
         season_id,player_id,round_id,minutes,points,two_points_made,two_points_attempted,
         three_points_made,three_points_attempted,free_throws_made,free_throws_attempted,
         rebounds,offensive_rebounds,defensive_rebounds,assists,steals,blocks,blocks_against,
         turnovers,fouls_committed,fouls_received,valuation,plus_minus,games_started
       )
       SELECT s.season_id,pm.player_id,m.round_id,
         ROUND(SUM(s.minutes_seconds)/60.0)::int,SUM(s.points),SUM(s.two_points_made),
         SUM(s.two_points_attempted),SUM(s.three_points_made),SUM(s.three_points_attempted),
         SUM(s.free_throws_made),SUM(s.free_throws_attempted),SUM(s.total_rebounds),
         SUM(s.offensive_rebounds),SUM(s.defensive_rebounds),SUM(s.assists),SUM(s.steals),
         SUM(s.blocks),SUM(s.blocks_against),SUM(s.turnovers),SUM(s.fouls_committed),
         SUM(s.fouls_received),SUM(s.valuation),SUM(s.plus_minus),
         SUM(CASE WHEN s.is_starter THEN 1 ELSE 0 END)
       FROM official_player_game_stats s
       JOIN matches m ON m.season_id=s.season_id AND m.official_game_code=s.game_code
       JOIN official_player_mappings pm
         ON pm.season_id=s.season_id AND pm.provider_player_code=s.provider_player_code
        AND pm.provider='euroleague_advanced' AND pm.status='matched' AND pm.player_id IS NOT NULL
       WHERE s.season_id=$1 AND m.round_id=$2
       GROUP BY s.season_id,pm.player_id,m.round_id
       ON CONFLICT (season_id,player_id,round_id) DO UPDATE SET
         minutes=EXCLUDED.minutes,points=EXCLUDED.points,
         two_points_made=EXCLUDED.two_points_made,two_points_attempted=EXCLUDED.two_points_attempted,
         three_points_made=EXCLUDED.three_points_made,three_points_attempted=EXCLUDED.three_points_attempted,
         free_throws_made=EXCLUDED.free_throws_made,free_throws_attempted=EXCLUDED.free_throws_attempted,
         rebounds=EXCLUDED.rebounds,offensive_rebounds=EXCLUDED.offensive_rebounds,
         defensive_rebounds=EXCLUDED.defensive_rebounds,assists=EXCLUDED.assists,
         steals=EXCLUDED.steals,blocks=EXCLUDED.blocks,blocks_against=EXCLUDED.blocks_against,
         turnovers=EXCLUDED.turnovers,fouls_committed=EXCLUDED.fouls_committed,
         fouls_received=EXCLUDED.fouls_received,valuation=EXCLUDED.valuation,
         plus_minus=EXCLUDED.plus_minus,games_started=EXCLUDED.games_started`,
      [seasonId, roundId]
    );
  };

  const getSyncCandidates = async (forceGame?: number) =>
    (
      await db.query(
        `SELECT og.game_code,og.scheduled_at,og.status,og.finalized_at,og.payload_checksum,
                m.round_id,m.round_name
         FROM official_games og
         JOIN matches m ON m.season_id=og.season_id AND m.official_game_code=og.game_code
         WHERE og.season_id=$1 AND og.provider='euroleague_advanced'
           AND ($2::int IS NOT NULL AND og.game_code=$2 OR $2::int IS NULL AND (
             og.scheduled_at BETWEEN NOW()-INTERVAL '48 hours' AND NOW()+INTERVAL '1 hour'
             OR og.status='live'
             OR og.finalized_at IS NULL AND og.scheduled_at < NOW()
           ))
         ORDER BY og.scheduled_at`,
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
        `SELECT m.id,m.official_game_code,m.status,m.date,og.finalized_at
         FROM matches m LEFT JOIN official_games og
           ON og.season_id=m.season_id AND og.game_code=m.official_game_code
         WHERE m.id=$1 AND m.season_id=$2`,
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
    upsertScheduleGame,
    upsertStanding,
    upsertTeamMapping,
    upsertPlayerMapping,
    getFantasyTeams,
    getFantasyPlayers,
    getTeamMappings,
    getPlayerMappings,
    upsertGameDetails,
    persistGameData,
    materializeRoundStats,
    getSyncCandidates,
    getGameByMatchId,
    storeProfiles,
  };
}
