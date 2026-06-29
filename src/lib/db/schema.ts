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
  index,
  unique,
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
  },
  (t) => ({
    unq_match: unique('unique_match').on(t.seasonId, t.roundId, t.homeId, t.awayId),
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

// 15. Tournaments Table
export const tournaments = pgTable('tournaments', {
  id: integer('id').primaryKey(),
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
});

// 16. Tournament Phases Table
export const tournamentPhases = pgTable(
  'tournament_phases',
  {
    id: serial('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    tournamentId: integer('tournament_id').references(() => tournaments.id),
    name: text('name'),
    type: text('type'),
    orderIndex: integer('order_index'),
  },
  (t) => ({
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
    id: integer('id').primaryKey(),
    seasonId: text('season_id')
      .notNull()
      .default(DEFAULT_SEASON_ID)
      .references(() => seasons.id),
    tournamentId: integer('tournament_id').references(() => tournaments.id),
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
    tournamentId: integer('tournament_id').references(() => tournaments.id),
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
