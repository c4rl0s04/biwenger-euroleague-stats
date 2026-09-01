import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  bigint,
  date,
  foreignKey,
  index,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';

export const DEFAULT_SEASON_ID = '2025-26';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  password: text('password'),
  icon: text('icon'),
  colorIndex: integer('color_index').default(0),
  biwengerToken: text('biwenger_token'),
});

// Server-only encrypted Biwenger credentials. The legacy users.biwenger_token
// column remains temporarily for staged migration and rollback compatibility.
export const userBiwengerCredentials = pgTable(
  'user_biwenger_credentials',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    keyId: text('key_id').notNull(),
    ciphertext: text('ciphertext').notNull(),
    iv: text('iv').notNull(),
    authTag: text('auth_tag').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    keyIdIdx: index('idx_user_biwenger_credentials_key_id').on(t.keyId),
  })
);

// 1b. Teams Table
export const teams = pgTable('teams', {
  id: integer('id').primaryKey(),
  name: text('name'),
  shortName: text('short_name'),
  code: text('code'),
  img: text('img'),
  city: text('city'),
  arenaName: text('arena_name'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
});

// 1c. Seasons Table
export const seasons = pgTable(
  'seasons',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    status: text('status').notNull(),
    startsAt: date('starts_at'),
    endsAt: date('ends_at'),
    frozenAt: timestamp('frozen_at'),
    sourceLeagueId: text('source_league_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('idx_seasons_status').on(t.status),
  })
);

// 2. Players Table
export const players = pgTable('players', {
  id: integer('id').primaryKey(),
  name: text('name'),
  position: text('position'), // '1', '2', etc stored as text? Schema says TEXT.
  puntos: integer('puntos'),
  partidosJugados: integer('partidos_jugados'),
  playedHome: integer('played_home'),
  playedAway: integer('played_away'),
  pointsHome: integer('points_home'),
  pointsAway: integer('points_away'),
  pointsLastSeason: integer('points_last_season'),
  ownerId: text('owner_id'), // Referenced as TEXT in schema
  status: text('status'),
  priceIncrement: integer('price_increment'),
  birthDate: text('birth_date'),
  height: integer('height'),
  weight: integer('weight'),
  price: integer('price'),
  euroleagueCode: text('euroleague_code'),
  dorsal: text('dorsal'),
  country: text('country'),
  teamId: integer('team_id'),
  img: text('img'),
});

// 2b. Season-specific player state.
export const playerSeasons = pgTable(
  'player_seasons',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    playerId: integer('player_id')
      .notNull()
      .references(() => players.id),
    teamId: integer('team_id'),
    ownerId: text('owner_id'),
    puntos: integer('puntos'),
    partidosJugados: integer('partidos_jugados'),
    playedHome: integer('played_home'),
    playedAway: integer('played_away'),
    pointsHome: integer('points_home'),
    pointsAway: integer('points_away'),
    pointsLastSeason: integer('points_last_season'),
    status: text('status'),
    priceIncrement: integer('price_increment'),
    price: integer('price'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    playerSeasonUnique: unique('unique_player_season').on(t.seasonId, t.playerId),
    seasonOwnerIdx: index('idx_player_seasons_season_owner').on(t.seasonId, t.ownerId),
    seasonTeamIdx: index('idx_player_seasons_season_team').on(t.seasonId, t.teamId),
  })
);

// 2c. Season-specific user state.
export const userSeasons = pgTable(
  'user_seasons',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name'),
    icon: text('icon'),
    colorIndex: integer('color_index').default(0),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userSeasonUnique: unique('unique_user_season').on(t.seasonId, t.userId),
    seasonUserIdx: index('idx_user_seasons_season_user').on(t.seasonId, t.userId),
  })
);

// 3. User Rounds Table
export const userRounds = pgTable(
  'user_rounds',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id'),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    points: integer('points'),
    participated: boolean('participated').default(true),
    alineacion: text('alineacion'), // JSON string?
  },
  (t) => ({
    unq_user_round: unique('unique_user_round').on(t.seasonId, t.userId, t.roundId),
    seasonRoundIdx: index('idx_user_rounds_season_round').on(t.seasonId, t.roundId),
  })
);

// 4. Fichajes (Transfers) Table
export const fichajes = pgTable(
  'fichajes',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    timestamp: bigint('timestamp', { mode: 'number' }),
    fecha: text('fecha'),
    playerId: integer('player_id'),
    precio: integer('precio'),
    vendedor: text('vendedor'),
    comprador: text('comprador'),
  },
  (t) => ({
    unq_fichaje: unique('unique_fichaje').on(
      t.seasonId,
      t.timestamp,
      t.playerId,
      t.vendedor,
      t.comprador,
      t.precio
    ),
    seasonTimestampIdx: index('idx_fichajes_season_timestamp').on(t.seasonId, t.timestamp),
  })
);

// 5. Lineups Table
export const lineups = pgTable(
  'lineups',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id'),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    playerId: integer('player_id'),
    isCaptain: boolean('is_captain'),
    role: text('role'),
  },
  (t) => ({
    unq_lineup: unique('unique_lineup').on(t.seasonId, t.userId, t.roundId, t.playerId),
    seasonRoundIdx: index('idx_lineups_season_round').on(t.seasonId, t.roundId),
  })
);

// 6. Matches Table
export const matches = pgTable(
  'matches',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    homeId: integer('home_id'),
    awayId: integer('away_id'),
    date: timestamp('date'),
    status: text('status'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    homeScoreRegtime: integer('home_score_regtime'),
    awayScoreRegtime: integer('away_score_regtime'),
    homeQ1: integer('home_q1'),
    awayQ1: integer('away_q1'),
    homeQ2: integer('home_q2'),
    awayQ2: integer('away_q2'),
    homeQ3: integer('home_q3'),
    awayQ3: integer('away_q3'),
    homeQ4: integer('home_q4'),
    awayQ4: integer('away_q4'),
    homeOt: integer('home_ot'),
    awayOt: integer('away_ot'),
    officialGameCode: integer('official_game_code'),
  },
  (t) => ({
    unq_match: unique('unique_match').on(t.seasonId, t.roundId, t.homeId, t.awayId),
    unqOfficialGame: unique('unique_match_official_game').on(t.seasonId, t.officialGameCode),
    seasonRoundIdx: index('idx_matches_season_round').on(t.seasonId, t.roundId),
  })
);

// 7. Player Round Stats Table
export const playerRoundStats = pgTable(
  'player_round_stats',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    playerId: integer('player_id'),
    roundId: integer('round_id'),
    fantasyPoints: integer('fantasy_points'),
    minutes: integer('minutes'),
    points: integer('points'),
    twoPointsMade: integer('two_points_made'),
    twoPointsAttempted: integer('two_points_attempted'),
    threePointsMade: integer('three_points_made'),
    threePointsAttempted: integer('three_points_attempted'),
    freeThrowsMade: integer('free_throws_made'),
    freeThrowsAttempted: integer('free_throws_attempted'),
    rebounds: integer('rebounds'),
    assists: integer('assists'),
    steals: integer('steals'),
    blocks: integer('blocks'),
    turnovers: integer('turnovers'),
    foulsCommitted: integer('fouls_committed'),
    valuation: integer('valuation'),
    offensiveRebounds: integer('offensive_rebounds'),
    defensiveRebounds: integer('defensive_rebounds'),
    foulsReceived: integer('fouls_received'),
    blocksAgainst: integer('blocks_against'),
    plusMinus: integer('plus_minus'),
    gamesStarted: integer('games_started'),
  },
  (t) => ({
    unq_player_round_stat: unique('unique_player_round_stat').on(t.seasonId, t.playerId, t.roundId),
    seasonRoundIdx: index('idx_player_round_stats_season_round').on(t.seasonId, t.roundId),
  })
);

// 8. Porras Table
export const porras = pgTable(
  'porras',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id'),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    result: text('result'),
    aciertos: integer('aciertos'),
  },
  (t) => ({
    unq_porra: unique('unique_porra').on(t.seasonId, t.userId, t.roundId),
  })
);

// 9. Market Values Table
export const marketValues = pgTable(
  'market_values',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    playerId: integer('player_id'),
    price: integer('price'),
    date: date('date'), // Stored as DATE
  },
  (t) => ({
    unq_player_date: unique('unique_player_date').on(t.seasonId, t.playerId, t.date),
    seasonDateIdx: index('idx_market_values_season_date').on(t.seasonId, t.date),
  })
);

// 10. Transfer Bids Table
export const transferBids = pgTable('transfer_bids', {
  id: serial('id').primaryKey(),
  seasonId: text('season_id')
    .notNull()
    .default(DEFAULT_SEASON_ID)
    .references(() => seasons.id),
  transferId: integer('transfer_id').references(() => fichajes.id),
  bidderId: text('bidder_id'),
  bidderName: text('bidder_name'),
  amount: integer('amount'),
});

// 11. Initial Squads Table
export const initialSquads = pgTable(
  'initial_squads',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id'),
    playerId: integer('player_id'),
    price: integer('price'),
  },
  (t) => ({
    unq_initial_squad: unique('unique_initial_squad').on(t.seasonId, t.userId, t.playerId),
  })
);

// 12. Finances Table
export const finances = pgTable('finances', {
  id: serial('id').primaryKey(),
  seasonId: text('season_id')
    .notNull()
    .default(DEFAULT_SEASON_ID)
    .references(() => seasons.id),
  userId: text('user_id'),
  roundId: integer('round_id'),
  date: text('date'),
  type: text('type'),
  amount: integer('amount'),
  description: text('description'),
});

// 13. Player Mappings Table
export const playerMappings = pgTable('player_mappings', {
  biwengerId: integer('biwenger_id').primaryKey(),
  euroleagueCode: text('euroleague_code').notNull(),
  detailsJson: text('details_json'),
});

// 14. Sync Meta Table
export const syncMeta = pgTable('sync_meta', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at'),
});

// 14b. Season-scoped mappings from Biwenger identities to the official provider.
export const officialTeamMappings = pgTable(
  'official_team_mappings',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    provider: text('provider').notNull().default('euroleague_advanced'),
    providerTeamCode: text('provider_team_code').notNull(),
    providerName: text('provider_name').notNull(),
    crestUrl: text('crest_url'),
    matchMethod: text('match_method').notNull(),
    confidence: doublePrecision('confidence').notNull().default(1),
    rawPayload: jsonb('raw_payload'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonTeamUnique: unique('unique_official_team_mapping').on(t.seasonId, t.provider, t.teamId),
    seasonCodeUnique: unique('unique_official_team_code').on(
      t.seasonId,
      t.provider,
      t.providerTeamCode
    ),
  })
);

export const officialPlayerMappings = pgTable(
  'official_player_mappings',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    playerId: integer('player_id').references(() => players.id),
    provider: text('provider').notNull().default('euroleague_advanced'),
    providerPlayerCode: text('provider_player_code').notNull(),
    providerName: text('provider_name').notNull(),
    providerTeamCode: text('provider_team_code'),
    imageUrl: text('image_url'),
    age: integer('age'),
    matchMethod: text('match_method').notNull(),
    confidence: doublePrecision('confidence').notNull().default(1),
    status: text('status').notNull().default('review_required'),
    rawPayload: jsonb('raw_payload'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonCodeUnique: unique('unique_official_player_code').on(
      t.seasonId,
      t.provider,
      t.providerPlayerCode
    ),
    seasonPlayerUnique: unique('unique_official_player_mapping').on(
      t.seasonId,
      t.provider,
      t.playerId
    ),
  })
);

// 14c. Canonical official game data for the configured season.
export const officialGames = pgTable(
  'official_games',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    provider: text('provider').notNull().default('euroleague_advanced'),
    gameCode: integer('game_code').notNull(),
    gameId: text('game_id').notNull(),
    roundNumber: integer('round_number'),
    roundCode: text('round_code'),
    phase: text('phase'),
    homeTeamCode: text('home_team_code').notNull(),
    awayTeamCode: text('away_team_code').notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    isDateConfirmed: boolean('is_date_confirmed').default(false),
    isTimeConfirmed: boolean('is_time_confirmed').default(false),
    isPlayed: boolean('is_played').default(false),
    isLive: boolean('is_live').default(false),
    status: text('status').notNull().default('scheduled'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    homeScoreRegtime: integer('home_score_regtime'),
    awayScoreRegtime: integer('away_score_regtime'),
    homeQ1: integer('home_q1'),
    awayQ1: integer('away_q1'),
    homeQ2: integer('home_q2'),
    awayQ2: integer('away_q2'),
    homeQ3: integer('home_q3'),
    awayQ3: integer('away_q3'),
    homeQ4: integer('home_q4'),
    awayQ4: integer('away_q4'),
    homeOt: integer('home_ot'),
    awayOt: integer('away_ot'),
    arenaCode: text('arena_code'),
    arenaName: text('arena_name'),
    arenaCapacity: integer('arena_capacity'),
    homeCoach: text('home_coach'),
    awayCoach: text('away_coach'),
    referee1: text('referee_1'),
    referee2: text('referee_2'),
    referee3: text('referee_3'),
    payloadChecksum: text('payload_checksum'),
    rawSchedule: jsonb('raw_schedule'),
    rawReport: jsonb('raw_report'),
    rawMetadata: jsonb('raw_metadata'),
    finalizedAt: timestamp('finalized_at', { withTimezone: true }),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonGameUnique: unique('unique_official_game').on(t.seasonId, t.provider, t.gameCode),
    seasonGameIdUnique: unique('unique_official_game_id').on(t.seasonId, t.provider, t.gameId),
    seasonScheduleIdx: index('idx_official_games_season_schedule').on(t.seasonId, t.scheduledAt),
  })
);

export const officialPlayerGameStats = pgTable(
  'official_player_game_stats',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    gameCode: integer('game_code').notNull(),
    providerPlayerCode: text('provider_player_code').notNull(),
    providerName: text('provider_name').notNull(),
    teamCode: text('team_code').notNull(),
    isHome: boolean('is_home'),
    isStarter: boolean('is_starter'),
    isPlaying: boolean('is_playing'),
    dorsal: text('dorsal'),
    minutes: text('minutes'),
    minutesSeconds: integer('minutes_seconds'),
    points: integer('points'),
    twoPointsMade: integer('two_points_made'),
    twoPointsAttempted: integer('two_points_attempted'),
    threePointsMade: integer('three_points_made'),
    threePointsAttempted: integer('three_points_attempted'),
    freeThrowsMade: integer('free_throws_made'),
    freeThrowsAttempted: integer('free_throws_attempted'),
    offensiveRebounds: integer('offensive_rebounds'),
    defensiveRebounds: integer('defensive_rebounds'),
    totalRebounds: integer('total_rebounds'),
    assists: integer('assists'),
    steals: integer('steals'),
    turnovers: integer('turnovers'),
    blocks: integer('blocks'),
    blocksAgainst: integer('blocks_against'),
    foulsCommitted: integer('fouls_committed'),
    foulsReceived: integer('fouls_received'),
    valuation: integer('valuation'),
    plusMinus: integer('plus_minus'),
    rawPayload: jsonb('raw_payload'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonPlayerGameUnique: unique('unique_official_player_game_stat').on(
      t.seasonId,
      t.gameCode,
      t.providerPlayerCode
    ),
    seasonGameIdx: index('idx_official_player_game_stats_game').on(t.seasonId, t.gameCode),
  })
);

export const officialPlayByPlay = pgTable(
  'official_play_by_play',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    gameCode: integer('game_code').notNull(),
    sequence: integer('sequence').notNull(),
    providerPlayNumber: integer('provider_play_number'),
    period: integer('period'),
    minute: integer('minute'),
    markerTime: text('marker_time'),
    playType: text('play_type'),
    teamCode: text('team_code'),
    providerPlayerCode: text('provider_player_code'),
    playerName: text('player_name'),
    teamName: text('team_name'),
    dorsal: text('dorsal'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    comment: text('comment'),
    playInfo: text('play_info'),
    rawPayload: jsonb('raw_payload'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonGameSequenceUnique: unique('unique_official_play').on(t.seasonId, t.gameCode, t.sequence),
    seasonGameIdx: index('idx_official_play_by_play_game').on(t.seasonId, t.gameCode),
  })
);

export const officialShots = pgTable(
  'official_shots',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    gameCode: integer('game_code').notNull(),
    annotationNumber: integer('annotation_number').notNull(),
    teamCode: text('team_code'),
    providerPlayerCode: text('provider_player_code'),
    playerName: text('player_name'),
    actionId: text('action_id'),
    action: text('action'),
    points: integer('points'),
    coordinateX: integer('coordinate_x'),
    coordinateY: integer('coordinate_y'),
    zone: text('zone'),
    isFastbreak: boolean('is_fastbreak'),
    isSecondChance: boolean('is_second_chance'),
    isPointsOffTurnover: boolean('is_points_off_turnover'),
    minute: integer('minute'),
    markerTime: text('marker_time'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }),
    rawPayload: jsonb('raw_payload'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonGameAnnotationUnique: unique('unique_official_shot').on(
      t.seasonId,
      t.gameCode,
      t.annotationNumber
    ),
    seasonGameIdx: index('idx_official_shots_game').on(t.seasonId, t.gameCode),
  })
);

export const officialTeamStandings = pgTable(
  'official_team_standings',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .references(() => seasons.id),
    roundNumber: integer('round_number').notNull(),
    teamCode: text('team_code').notNull(),
    position: integer('position'),
    gamesPlayed: integer('games_played'),
    gamesWon: integer('games_won'),
    gamesLost: integer('games_lost'),
    pointsFor: integer('points_for'),
    pointsAgainst: integer('points_against'),
    rawPayload: jsonb('raw_payload'),
    syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    seasonRoundTeamUnique: unique('unique_official_team_standing').on(
      t.seasonId,
      t.roundNumber,
      t.teamCode
    ),
  })
);

// 15. Tournaments Table
export const tournaments = pgTable(
  'tournaments',
  {
    internalId: serial('internal_id').primaryKey(),
    id: integer('id').notNull(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    leagueId: integer('league_id'),
    name: text('name'),
    type: text('type'),
    status: text('status'),
    dataJson: text('data_json'),
    updatedAt: integer('updated_at'),
  },
  (t) => ({
    unq_tournament: unique('unique_tournament').on(t.seasonId, t.id),
  })
);

// 16. Tournament Phases Table
export const tournamentPhases = pgTable(
  'tournament_phases',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    tournamentId: integer('tournament_id'),
    name: text('name'),
    type: text('type'),
    orderIndex: integer('order_index'),
  },
  (t) => ({
    tournamentSeasonFk: foreignKey({
      columns: [t.seasonId, t.tournamentId],
      foreignColumns: [tournaments.seasonId, tournaments.id],
      name: 'tournament_phases_season_tournament_fk',
    }),
    unq_tournament_phase: unique('unique_tournament_phase').on(
      t.seasonId,
      t.tournamentId,
      t.orderIndex
    ),
  })
);

// 17. Tournament Fixtures Table
export const tournamentFixtures = pgTable(
  'tournament_fixtures',
  {
    internalId: serial('internal_id').primaryKey(),
    id: integer('id').notNull(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    tournamentId: integer('tournament_id'),
    phaseId: integer('phase_id').references(() => tournamentPhases.id),
    roundName: text('round_name'),
    roundId: integer('round_id'),
    groupName: text('group_name'),
    homeUserId: text('home_user_id'),
    awayUserId: text('away_user_id'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    date: integer('date'),
    status: text('status'),
  },
  (t) => ({
    tournamentSeasonFk: foreignKey({
      columns: [t.seasonId, t.tournamentId],
      foreignColumns: [tournaments.seasonId, tournaments.id],
      name: 'tournament_fixtures_season_tournament_fk',
    }),
    unq_tournament_fixture: unique('unique_tournament_fixture').on(
      t.seasonId,
      t.tournamentId,
      t.id
    ),
  })
);

// 18. Tournament Standings Table
export const tournamentStandings = pgTable(
  'tournament_standings',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    tournamentId: integer('tournament_id'),
    phaseName: text('phase_name'),
    groupName: text('group_name'),
    userId: text('user_id'),
    position: integer('position'),
    points: integer('points'),
    won: integer('won'),
    lost: integer('lost'),
    drawn: integer('drawn'),
    scored: integer('scored'),
    against: integer('against'),
  },
  (t) => ({
    tournamentSeasonFk: foreignKey({
      columns: [t.seasonId, t.tournamentId],
      foreignColumns: [tournaments.seasonId, tournaments.id],
      name: 'tournament_standings_season_tournament_fk',
    }),
    unq_tournament_standing: unique('unique_tournament_standing').on(
      t.seasonId,
      t.tournamentId,
      t.phaseName,
      t.groupName,
      t.userId
    ),
  })
);

// 19. Market Listings Table
// Daily snapshot of players currently available on the fantasy market.
// One row per player per sync date — idempotent via unique(player_id, listed_at).
export const marketListings = pgTable(
  'market_listings',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    playerId: integer('player_id'),
    listedAt: date('listed_at'),
    price: integer('price'),
    sellerId: text('seller_id'),
  },
  (t) => ({
    unq_market_listing: unique('unique_market_listing').on(t.seasonId, t.playerId, t.listedAt),
  })
);

// 20. Hoopgrid Challenges Table
export const hoopgridChallenges = pgTable('hoopgrid_challenges', {
  id: text('id').primaryKey(),
  gameDate: date('game_date').unique().notNull(),
  rows: text('rows'), // Stored as JSON string
  cols: text('cols'), // Stored as JSON string
  number: integer('number'), // Sequential challenge number (e.g., 21)
  possibleCounts: text('possible_counts'), // Stored as JSON string [n1, n2, ... n9]
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 21. Hoopgrid Guesses Table
export const hoopgridGuesses = pgTable(
  'hoopgrid_guesses',
  {
    id: text('id').primaryKey(),
    challengeId: text('challenge_id').references(() => hoopgridChallenges.id),
    userId: text('user_id').references(() => users.id),
    cellIndex: integer('cell_index').notNull(),
    playerId: integer('player_id').references(() => players.id),
    isCorrect: boolean('is_correct').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    unq_guess: unique('unique_guess').on(t.challengeId, t.userId, t.cellIndex),
  })
);

// 22. Playoff Predictions Table
export const playoffPredictions = pgTable(
  'playoff_predictions',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id').references(() => users.id),
    stage: text('stage'), // 'play-in', 'quarter', 'semi', 'final'
    matchId: text('match_id'), // 'PI-1', 'QF-1', etc.
    predictedWinnerId: integer('predicted_winner_id').references(() => teams.id),
    predictionDetails: text('prediction_details'), // e.g. "3-1" for series
    points: integer('points').default(0),
    isCorrect: boolean('is_correct'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (t) => ({
    unq_prediction: unique('unique_playoff_prediction').on(
      t.seasonId,
      t.userId,
      t.stage,
      t.matchId
    ),
  })
);

// 23. Playoff Results Table
export const playoffResults = pgTable(
  'playoff_results',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    matchId: text('match_id'), // 'PI-1', 'QF-1', etc.
    stage: text('stage'),
    winnerId: integer('winner_id').references(() => teams.id),
    score: text('score'), // e.g. "3-1" or "88-75"
    isCompleted: boolean('is_completed').default(false),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    unq_result: unique('unique_playoff_result').on(t.seasonId, t.matchId),
  })
);

// 24. User Playoff Media Table
export const userPlayoffMedia = pgTable(
  'user_playoff_media',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    userId: text('user_id').references(() => users.id),
    predictionImageUrl: text('prediction_image_url'),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (t) => ({
    unq_user_playoff_media: unique('unique_user_playoff_media').on(t.seasonId, t.userId),
  })
);

// 25. Assistant Conversations Table
export const assistantConversations = pgTable(
  'assistant_conversations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userUpdatedIdx: index('idx_assistant_conversations_user_updated').on(t.userId, t.updatedAt),
  })
);

// 26. Assistant Messages Table
export const assistantMessages = pgTable(
  'assistant_messages',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => assistantConversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    conversationCreatedIdx: index('idx_assistant_messages_conversation_created').on(
      t.conversationId,
      t.createdAt
    ),
  })
);
