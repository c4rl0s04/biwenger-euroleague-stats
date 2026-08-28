import { z } from 'zod';

const scalar = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const optionalScalar = scalar.optional();

export const scheduleRowSchema = z
  .object({
    game: z.union([z.string(), z.number()]),
    gamecode: z.union([z.string(), z.number()]),
    homecode: z.string().min(1),
    hometeam: z.string().min(1),
    awaycode: z.string().min(1),
    awayteam: z.string().min(1),
    gameday: optionalScalar,
    round: optionalScalar,
    group: optionalScalar,
    date: optionalScalar,
    startime: optionalScalar,
    arenacode: optionalScalar,
    arenaname: optionalScalar,
    arenacapacity: optionalScalar,
    confirmeddate: optionalScalar,
    confirmedtime: optionalScalar,
    played: optionalScalar,
  })
  .passthrough();

export const standingRowSchema = z
  .object({
    'club.code': z.string().min(1),
    'club.name': z.string().min(1),
    'club.images.crest': optionalScalar,
    position: optionalScalar,
    gamesPlayed: optionalScalar,
    gamesWon: optionalScalar,
    gamesLost: optionalScalar,
    pointsFor: optionalScalar,
    pointsAgainst: optionalScalar,
  })
  .passthrough();

export const playerProfileRowSchema = z
  .object({
    'player.code': z.union([z.string(), z.number()]),
    'player.name': z.string().min(1),
    'player.team.code': optionalScalar,
    'player.team.name': optionalScalar,
    'player.imageUrl': optionalScalar,
    'player.team.imageUrl': optionalScalar,
    'player.age': optionalScalar,
  })
  .passthrough();

export const gameReportRowSchema = z
  .object({
    'local.club.code': z.string().min(1),
    'road.club.code': z.string().min(1),
    Round: optionalScalar,
    'phaseType.code': optionalScalar,
    'phaseType.name': optionalScalar,
    'local.score': optionalScalar,
    'road.score': optionalScalar,
    utcDate: optionalScalar,
    date: optionalScalar,
    played: optionalScalar,
    'local.club.images.crest': optionalScalar,
    'road.club.images.crest': optionalScalar,
  })
  .passthrough();

export const gameMetadataRowSchema = z
  .object({
    Live: optionalScalar,
    ScoreA: optionalScalar,
    ScoreB: optionalScalar,
    ScoreQuarter1A: optionalScalar,
    ScoreQuarter2A: optionalScalar,
    ScoreQuarter3A: optionalScalar,
    ScoreQuarter4A: optionalScalar,
    ScoreQuarter1B: optionalScalar,
    ScoreQuarter2B: optionalScalar,
    ScoreQuarter3B: optionalScalar,
    ScoreQuarter4B: optionalScalar,
    ScoreExtraTimeA: optionalScalar,
    ScoreExtraTimeB: optionalScalar,
    Stadium: optionalScalar,
    Capacity: optionalScalar,
    CoachA: optionalScalar,
    CoachB: optionalScalar,
    Referee1: optionalScalar,
    Referee2: optionalScalar,
    Referee3: optionalScalar,
  })
  .passthrough();

export const boxScoreRowSchema = z
  .object({
    Player_ID: z.union([z.string(), z.number()]),
    Player: z.string().min(1),
    Team: z.string().min(1),
  })
  .catchall(z.unknown());

export const playByPlayRowSchema = z
  .object({
    TRUE_NUMBEROFPLAY: z.union([z.string(), z.number()]),
  })
  .catchall(z.unknown());

export const shotRowSchema = z
  .object({
    NUM_ANOT: z.union([z.string(), z.number()]),
  })
  .catchall(z.unknown());

export type EuroleagueRow = Record<string, unknown>;
