import type { SyncMode, SyncStepDefinition } from './manager';
import { run as syncBiwengerBoard } from './steps/biwenger-board';
import { run as syncBiwengerCatalog } from './steps/biwenger-catalog';
import { run as syncBiwengerFantasyPoints } from './steps/biwenger-fantasy-points';
import { run as syncBiwengerLineups } from './steps/biwenger-lineups';
import { run as syncBiwengerMarket } from './steps/biwenger-market';
import { run as syncBiwengerSquads } from './steps/biwenger-squads';
import { run as syncBiwengerTournaments } from './steps/biwenger-tournaments';
import { run as syncBiwengerUsers } from './steps/biwenger-users';
import { run as syncEuroleagueGames } from './steps/euroleague-games';
import { run as syncEuroleagueMasterData } from './steps/euroleague-master-data';
import { run as syncInitialSquads } from './steps/initial-squads';
import { run as syncMatches } from './steps/match-linking';
import { run as syncUserColors } from './steps/user-colors';

export const SYNC_STEP_IDS = [
  'biwenger-catalog',
  'euroleague-master-data',
  'match-linking',
  'biwenger-users',
  'euroleague-games',
  'biwenger-fantasy-points',
  'biwenger-lineups',
  'biwenger-board',
  'biwenger-squads',
  'biwenger-market',
  'biwenger-tournaments',
  'initial-squads',
  'user-colors',
] as const;

export type SyncStepId = (typeof SYNC_STEP_IDS)[number];

export const PIPELINE: readonly SyncStepDefinition[] = [
  {
    id: 'biwenger-catalog',
    title: 'Fantasy player, team and round catalogue',
    source: 'biwenger',
    writes: ['players', 'teams', 'player_seasons', 'market_values'],
    modes: ['routine', 'bootstrap'],
    dependencies: [],
    run: syncBiwengerCatalog,
  },
  {
    id: 'euroleague-master-data',
    title: 'Official calendar, standings and season mappings',
    source: 'euroleague',
    writes: [
      'official_games',
      'official_team_standings',
      'official_team_mappings',
      'official_player_mappings',
    ],
    modes: ['routine', 'bootstrap'],
    dependencies: ['biwenger-catalog'],
    run: syncEuroleagueMasterData,
  },
  {
    id: 'match-linking',
    title: 'Fantasy rounds linked to the official calendar',
    source: 'biwenger+database',
    writes: ['matches'],
    modes: ['routine', 'bootstrap'],
    dependencies: ['biwenger-catalog', 'euroleague-master-data'],
    run: syncMatches,
  },
  {
    id: 'biwenger-users',
    title: 'Fantasy league users',
    source: 'biwenger',
    writes: ['users', 'user_seasons'],
    modes: ['routine', 'bootstrap'],
    dependencies: [],
    run: syncBiwengerUsers,
  },
  {
    id: 'euroleague-games',
    title: 'Official scores, boxscores, play-by-play and shots',
    source: 'euroleague',
    writes: [
      'official_games',
      'official_player_game_stats',
      'official_play_by_play',
      'official_shots',
      'matches',
      'player_round_stats:sporting',
    ],
    modes: ['routine', 'bootstrap', 'live'],
    dependencies: ['match-linking'],
    run: syncEuroleagueGames,
  },
  {
    id: 'biwenger-fantasy-points',
    title: 'Authoritative fantasy points',
    source: 'biwenger',
    writes: ['player_round_stats:fantasy_points'],
    modes: ['routine', 'bootstrap'],
    dependencies: ['match-linking'],
    run: syncBiwengerFantasyPoints,
  },
  {
    id: 'biwenger-lineups',
    title: 'Manager lineups and round results',
    source: 'biwenger',
    writes: ['lineups', 'user_rounds'],
    modes: ['routine', 'bootstrap', 'live'],
    dependencies: ['biwenger-users', 'match-linking'],
    run: syncBiwengerLineups,
  },
  {
    id: 'biwenger-board',
    title: 'Transfers, bids, finances and prediction pools',
    source: 'biwenger',
    writes: ['fichajes', 'transfer_bids', 'finances', 'porras'],
    modes: ['routine', 'bootstrap'],
    dependencies: ['biwenger-catalog', 'biwenger-users'],
    run: syncBiwengerBoard,
  },
  {
    id: 'biwenger-squads',
    title: 'Current fantasy ownership',
    source: 'biwenger',
    writes: ['player_seasons:owner_id'],
    modes: ['routine', 'bootstrap'],
    dependencies: ['biwenger-catalog', 'biwenger-users'],
    run: syncBiwengerSquads,
  },
  {
    id: 'biwenger-market',
    title: 'Current fantasy market snapshot',
    source: 'biwenger',
    writes: ['market_listings'],
    modes: ['routine', 'bootstrap'],
    dependencies: ['biwenger-catalog', 'biwenger-users'],
    run: syncBiwengerMarket,
  },
  {
    id: 'biwenger-tournaments',
    title: 'Fantasy tournaments',
    source: 'biwenger',
    writes: ['tournaments', 'tournament_phases', 'tournament_fixtures', 'tournament_standings'],
    modes: ['routine', 'bootstrap'],
    dependencies: ['biwenger-users'],
    run: syncBiwengerTournaments,
  },
  {
    id: 'initial-squads',
    title: 'Initial squads derived from transfer history',
    source: 'database',
    writes: ['initial_squads'],
    modes: ['bootstrap'],
    dependencies: ['biwenger-board', 'biwenger-squads'],
    run: syncInitialSquads,
  },
  {
    id: 'user-colors',
    title: 'Deterministic season user colors',
    source: 'database',
    writes: ['user_seasons:color_index'],
    modes: ['bootstrap'],
    dependencies: ['biwenger-users'],
    run: syncUserColors,
  },
];

export function validatePipeline(steps: readonly SyncStepDefinition[] = PIPELINE): void {
  const ids = new Set<string>();
  for (const step of steps) {
    if (ids.has(step.id)) throw new Error(`Duplicate sync step id: ${step.id}`);
    for (const dependency of step.dependencies) {
      if (!ids.has(dependency)) {
        throw new Error(`Step ${step.id} has missing or out-of-order dependency ${dependency}.`);
      }
    }
    ids.add(step.id);
  }
}

export function selectPipeline(mode: SyncMode, selectedStep?: string): SyncStepDefinition[] {
  validatePipeline();
  if (selectedStep) {
    const step = PIPELINE.find((candidate) => candidate.id === selectedStep);
    if (!step) {
      throw new Error(
        `Unknown sync step "${selectedStep}". Valid steps: ${SYNC_STEP_IDS.join(', ')}.`
      );
    }
    if (!step.modes.includes(mode)) {
      throw new Error(`Step ${selectedStep} is not available in ${mode} mode.`);
    }
    return [step];
  }
  return PIPELINE.filter((step) => step.modes.includes(mode));
}
