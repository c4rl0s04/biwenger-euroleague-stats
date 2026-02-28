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
  unique,
} from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Using TEXT as per schema.js
  name: text('name'),
  icon: text('icon'),
  colorIndex: integer('color_index').default(0),
});

// 1b. Teams Table
export const teams = pgTable('teams', {
  id: integer('id').primaryKey(),
  name: text('name'),
  shortName: text('short_name'),
  code: text('code'),
  img: text('img'),
});

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

// 3. User Rounds Table
export const userRounds = pgTable(
  'user_rounds',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id'),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    points: integer('points'),
    participated: boolean('participated').default(true),
    alineacion: text('alineacion'), // JSON string?
  },
  (t) => ({
    unq_user_round: unique('unique_user_round').on(t.userId, t.roundId),
  })
);

// 4. Fichajes (Transfers) Table
export const fichajes = pgTable(
  'fichajes',
  {
    id: serial('id').primaryKey(),
    timestamp: bigint('timestamp', { mode: 'number' }),
    fecha: text('fecha'),
    playerId: integer('player_id'),
    precio: integer('precio'),
    vendedor: text('vendedor'),
    comprador: text('comprador'),
  },
  (t) => ({
    unq_fichaje: unique('unique_fichaje').on(
      t.timestamp,
      t.playerId,
      t.vendedor,
      t.comprador,
      t.precio
    ),
  })
);

// 5. Lineups Table
export const lineups = pgTable(
  'lineups',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id'),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    playerId: integer('player_id'),
    isCaptain: boolean('is_captain'),
    role: text('role'),
  },
  (t) => ({
    unq_lineup: unique('unique_lineup').on(t.userId, t.roundId, t.playerId),
  })
);

// 6. Matches Table
export const matches = pgTable(
  'matches',
  {
    id: serial('id').primaryKey(),
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
    unq_match: unique('unique_match').on(t.roundId, t.homeId, t.awayId),
  })
);

// 7. Player Round Stats Table
export const playerRoundStats = pgTable(
  'player_round_stats',
  {
    id: serial('id').primaryKey(),
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
    unq_player_round_stat: unique('unique_player_round_stat').on(t.playerId, t.roundId),
  })
);

// 8. Porras Table
export const porras = pgTable(
  'porras',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id'),
    roundId: integer('round_id'),
    roundName: text('round_name'),
    result: text('result'),
    aciertos: integer('aciertos'),
  },
  (t) => ({
    unq_porra: unique('unique_porra').on(t.userId, t.roundId),
  })
);

// 9. Market Values Table
export const marketValues = pgTable(
  'market_values',
  {
    id: serial('id').primaryKey(),
    playerId: integer('player_id'),
    price: integer('price'),
    date: date('date'), // Stored as DATE
  },
  (t) => ({
    unq_player_date: unique('unique_player_date').on(t.playerId, t.date),
  })
);

// 10. Transfer Bids Table
export const transferBids = pgTable('transfer_bids', {
  id: serial('id').primaryKey(),
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
    userId: text('user_id'),
    playerId: integer('player_id'),
    price: integer('price'),
  },
  (t) => ({
    unq_initial_squad: unique('unique_initial_squad').on(t.userId, t.playerId),
  })
);

// 12. Finances Table
export const finances = pgTable('finances', {
  id: serial('id').primaryKey(),
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
    tournamentId: integer('tournament_id').references(() => tournaments.id),
    name: text('name'),
    type: text('type'),
    orderIndex: integer('order_index'),
  },
  (t) => ({
    unq_tournament_phase: unique('unique_tournament_phase').on(t.tournamentId, t.orderIndex),
  })
);

// 17. Tournament Fixtures Table
export const tournamentFixtures = pgTable(
  'tournament_fixtures',
  {
    id: integer('id').primaryKey(),
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
    unq_tournament_fixture: unique('unique_tournament_fixture').on(t.tournamentId, t.id),
  })
);

// 18. Tournament Standings Table
export const tournamentStandings = pgTable(
  'tournament_standings',
  {
    id: serial('id').primaryKey(),
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
    playerId: integer('player_id'),
    listedAt: date('listed_at'),
    price: integer('price'),
    sellerId: text('seller_id'),
  },
  (t) => ({
    unq_market_listing: unique('unique_market_listing').on(t.playerId, t.listedAt),
  })
);
