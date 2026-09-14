import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    connect: vi.fn(),
    end: vi.fn(async () => {}),
    query: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock('../../db/client', () => ({ db: mockDb }));
vi.mock('../../db/schema_init', () => ({
  ensureSchema: vi.fn(async () => {}),
  validateSchemaReady: vi.fn(async () => {}),
}));
vi.mock('../../utils/cache', () => ({ clearCache: vi.fn() }));
vi.mock('../season-guard', () => ({
  assertSyncSeasonWritable: vi.fn(async () => ({
    seasonId: '2025-26',
    status: 'active',
    euroleagueCode: 'E2025',
  })),
}));

describe('Local End-to-End Pipeline Dry Run', () => {
  let executedSteps: string[] = [];

  beforeEach(() => {
    executedSteps = [];
    vi.clearAllMocks();

    mockDb.connect.mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [{ locked: true }] }),
      release: vi.fn(),
    });

    mockDb.query.mockImplementation(async (sqlText: string) => {
      if (typeof sqlText === 'string') {
        if (sqlText.includes('SELECT') && sqlText.includes('user_seasons')) {
          return {
            rows: [
              { id: '1', name: 'User 1', icon: null, color_index: 0 },
              { id: '2', name: 'User 2', icon: null, color_index: 1 },
            ],
          };
        }
        if (sqlText.includes('fichajes')) {
          return { rows: [] };
        }
      }
      return { rows: [], rowCount: 0 };
    });

    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });
  });

  it('runs complete bootstrap pipeline in dependency order against mock local context', async () => {
    const { PIPELINE } = await import('../pipeline');
    const { SyncManager } = await import('../manager');

    const manager = new SyncManager({
      mode: 'bootstrap',
      useAdvisoryLock: false,
    });

    manager.setBiwengerCompetition({
      rounds: [
        { id: 1, name: 'Jornada 1', status: 'finished' },
        { id: 2, name: 'Jornada 2', status: 'scheduled' },
      ],
      players: {
        101: { id: 101, name: 'Player One', team: { id: 1 } },
      },
      teams: {
        1: { id: 1, name: 'Real Madrid' },
      },
    });

    // Add each real step from the pipeline, wrapping its run to track execution order
    for (const stepDef of PIPELINE) {
      manager.addStep({
        ...stepDef,
        run: async (mgr) => {
          executedSteps.push(stepDef.id);
          return { summary: `${stepDef.id} executed safely in local test mode` };
        },
      });
    }

    await manager.run();

    expect(manager.hasErrors).toBe(false);
    expect(executedSteps).toEqual(PIPELINE.map((s) => s.id));
    expect(executedSteps).toContain('biwenger-catalog');
    expect(executedSteps).toContain('euroleague-master-data');
    expect(executedSteps).toContain('match-linking');
    expect(executedSteps).toContain('initial-squads');
    expect(executedSteps).toContain('user-colors');
    expect(executedSteps).toContain('biwenger-tournaments');
  });

  it('executes individual thinned steps through their exported run handlers', async () => {
    const { SyncManager } = await import('../manager');
    const manager = new SyncManager({ mode: 'routine', useAdvisoryLock: false });

    manager.context.db = mockDb;
    manager.context.seasonId = '2025-26';
    manager.setBiwengerCompetition({
      rounds: [{ id: 1, name: 'Jornada 1', status: 'finished' }],
      players: {},
      teams: {},
    });

    // Test biwenger-tournaments step handler with overrides
    const { run: runTournaments } = await import('../steps/biwenger-tournaments');
    const tournamentsResult = await runTournaments(manager, {
      fetchRoundsLeague: vi.fn().mockResolvedValue({ data: { fixtures: [] } }),
    });
    expect(tournamentsResult.counts?.tournaments).toBe(0);

    // Test biwenger-users step handler with overrides
    const { run: runUsers } = await import('../steps/biwenger-users');
    const usersResult = await runUsers(manager, {
      fetchLeague: vi.fn().mockResolvedValue({
        data: { standings: [{ id: 1, name: 'Alice' }] },
      }),
      prepareMutations: () =>
        ({
          upsertUser: vi.fn(),
          markSeasonUsersInactiveExcept: vi.fn(),
        }) as any,
    });
    expect(usersResult.counts.users).toBe(1);

    // Test user-colors step handler with overrides
    const { run: runColors } = await import('../steps/user-colors');
    const colorsResult = await runColors(manager, {
      prepareMutations: () =>
        ({
          getAllUsers: vi.fn().mockResolvedValue({ all: () => [] }),
          updateUserColor: vi.fn(),
        }) as any,
    });
    expect(colorsResult.counts.users).toBe(0);

    // Test initial-squads step handler with overrides
    const { run: runInitialSquads } = await import('../steps/initial-squads');
    const initialSquadsResult = await runInitialSquads(manager, {
      prepareMutations: () =>
        ({
          clearInitialSquads: vi.fn(),
          getAllUsers: vi.fn().mockResolvedValue({ all: () => [] }),
          getTransfersForBacktracking: vi.fn().mockResolvedValue([]),
          getPlayersOwnedByUser: vi.fn().mockResolvedValue([]),
          getInitialPrice: vi.fn(),
          insertInitialSquad: vi.fn(),
        }) as any,
    });
    expect(initialSquadsResult.counts.users).toBe(0);
  });
});
