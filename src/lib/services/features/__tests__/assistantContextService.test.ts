import { beforeEach, describe, expect, it, vi } from 'vitest';

const { services, playerContextService } = vi.hoisted(() => ({
  services: {
    fetchCaptainRecommendations: vi.fn(),
    fetchCaptainStats: vi.fn(),
    fetchEfficiencyStats: vi.fn(),
    fetchLeagueComparisonStats: vi.fn(),
    fetchMarketOpportunities: vi.fn(),
    fetchMarketStats: vi.fn(),
    fetchMarketTrendsAnalysis: vi.fn(),
    fetchRecentTransfers: vi.fn(),
    fetchReliabilityStats: vi.fn(),
    fetchRoundStandings: vi.fn(),
    fetchRoundWinners: vi.fn(),
    fetchUserLineup: vi.fn(),
    fetchUserRecentRounds: vi.fn(),
    fetchUserSeasonStats: vi.fn(),
    fetchUserSquadDetails: vi.fn(),
    fetchUserTopContributors: vi.fn(),
    fetchValueRanking: vi.fn(),
    fetchVolatilityStats: vi.fn(),
    getCompareDataLite: vi.fn(),
    getCurrentRoundState: vi.fn(),
    getFullStandings: vi.fn(),
    getLeagueOverview: vi.fn(),
    getNextRoundData: vi.fn(),
    getUserPerformanceHistoryService: vi.fn(),
    getUserScheduleService: vi.fn(),
  },
  playerContextService: {
    buildPlayerContextForMessage: vi.fn(),
  },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/services', () => services);
vi.mock('@/lib/services/features/assistantPlayerContextService', () => playerContextService);

describe('assistant context service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playerContextService.buildPlayerContextForMessage.mockResolvedValue(null);
    services.fetchCaptainRecommendations.mockResolvedValue([]);
    services.fetchCaptainStats.mockResolvedValue({});
    services.fetchEfficiencyStats.mockResolvedValue([]);
    services.fetchLeagueComparisonStats.mockResolvedValue([]);
    services.fetchMarketOpportunities.mockResolvedValue([]);
    services.fetchMarketStats.mockResolvedValue({});
    services.fetchMarketTrendsAnalysis.mockResolvedValue([]);
    services.fetchRecentTransfers.mockResolvedValue([]);
    services.fetchReliabilityStats.mockResolvedValue([]);
    services.fetchRoundStandings.mockResolvedValue([]);
    services.fetchRoundWinners.mockResolvedValue([]);
    services.fetchUserLineup.mockResolvedValue({ players: [] });
    services.fetchUserRecentRounds.mockResolvedValue([]);
    services.fetchUserSeasonStats.mockResolvedValue({});
    services.fetchUserSquadDetails.mockResolvedValue({ players: [] });
    services.fetchUserTopContributors.mockResolvedValue([]);
    services.fetchValueRanking.mockResolvedValue([]);
    services.fetchVolatilityStats.mockResolvedValue([]);
    services.getCompareDataLite.mockResolvedValue({
      users: [],
      standings: [],
      predictions: { promedios: [] },
    });
    services.getCurrentRoundState.mockResolvedValue({ currentRound: null });
    services.getFullStandings.mockResolvedValue([]);
    services.getLeagueOverview.mockResolvedValue({});
    services.getNextRoundData.mockResolvedValue({ nextRound: null });
    services.getUserPerformanceHistoryService.mockResolvedValue([]);
    services.getUserScheduleService.mockResolvedValue({ matches: [], userPlayers: [] });
  });

  it('selects player context for player questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    playerContextService.buildPlayerContextForMessage.mockResolvedValue(
      'Jugador: Walter Tavares\nMedia fantasy temporada: 16.4'
    );

    const blocks = await buildAssistantContext({
      userId: '42',
      message: '¿Qué tal está Tavares?',
    });

    expect(getAssistantContextProviderNamesForMessage('¿Qué tal está Tavares?')).toContain(
      'players'
    );
    expect(blocks).toEqual([
      {
        label: 'Player context',
        content: 'Jugador: Walter Tavares\nMedia fantasy temporada: 16.4',
      },
    ]);
  });

  it('uses the signed-in user id for personal squad context', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    services.fetchUserSeasonStats.mockResolvedValue({
      name: 'Carlos',
      position: 2,
      total_points: 1234,
      average_points: 76.4,
    });
    services.fetchUserSquadDetails.mockResolvedValue({
      total_value: 123000000,
      price_trend: 750000,
      player_count: 12,
      players: [{ name: 'Tavares', team_short_name: 'RMA', position: 'C', points: 300 }],
    });

    const blocks = await buildAssistantContext({
      userId: '42',
      message: '¿A quién vendo de mi plantilla?',
    });

    expect(getAssistantContextProviderNamesForMessage('¿A quién vendo de mi plantilla?')).toContain(
      'my_team'
    );
    expect(services.fetchUserSquadDetails).toHaveBeenCalledWith('42');
    expect(services.fetchUserSeasonStats).toHaveBeenCalledWith('42');
    expect(blocks.some((block) => block.label === 'Signed-in user context')).toBe(true);
    expect(blocks.map((block) => block.content).join('\n')).toContain('Carlos');
  });

  it('selects market context for market questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    services.fetchMarketOpportunities.mockResolvedValue([{ name: 'Jugador barato', price: 1000 }]);

    const blocks = await buildAssistantContext({
      userId: '42',
      message: '¿Qué oportunidades hay en mercado?',
    });

    expect(
      getAssistantContextProviderNamesForMessage('¿Qué oportunidades hay en mercado?')
    ).toContain('market');
    expect(services.fetchMarketStats).toHaveBeenCalled();
    expect(blocks.some((block) => block.label === 'Market context')).toBe(true);
  });

  it('selects league context for standings questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    services.getFullStandings.mockResolvedValue([{ id: '42', name: 'Carlos', total_points: 900 }]);

    const blocks = await buildAssistantContext({
      userId: '42',
      message: '¿Quién va líder en la clasificación?',
    });

    expect(
      getAssistantContextProviderNamesForMessage('¿Quién va líder en la clasificación?')
    ).toContain('standings');
    expect(services.getFullStandings).toHaveBeenCalledWith({});
    expect(blocks.some((block) => block.label === 'League context')).toBe(true);
  });

  it('selects comparison context for manager comparison questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    services.getCompareDataLite.mockResolvedValue({
      users: [{ id: '42', name: 'Carlos' }],
      standings: [{ name: 'Carlos', total_points: 900 }],
      predictions: { promedios: [] },
    });

    const blocks = await buildAssistantContext({
      userId: '42',
      message: 'Compárame con Carlos',
    });

    expect(getAssistantContextProviderNamesForMessage('Compárame con Carlos')).toContain('compare');
    expect(services.getCompareDataLite).toHaveBeenCalled();
    expect(blocks.some((block) => block.label === 'Comparison context')).toBe(true);
  });

  it('does not load DB-heavy context for unrelated generic questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');

    const blocks = await buildAssistantContext({
      userId: '42',
      message: '¿Qué es un agente de IA?',
    });

    expect(getAssistantContextProviderNamesForMessage('¿Qué es un agente de IA?')).toEqual([]);
    expect(blocks).toEqual([]);
    expect(services.getFullStandings).not.toHaveBeenCalled();
    expect(services.fetchUserSquadDetails).not.toHaveBeenCalled();
    expect(services.fetchMarketStats).not.toHaveBeenCalled();
  });

  it('redacts secrets and raw emails from context blocks', async () => {
    const { buildAssistantContext, formatAssistantContextBlocks } =
      await import('@/lib/services/features/assistantContextService');
    playerContextService.buildPlayerContextForMessage.mockResolvedValue(
      'Jugador: Tavares\nemail: carlos@example.com\npassword: abc123\nbiwenger_token: token-123'
    );

    const blocks = await buildAssistantContext({
      userId: '42',
      message: 'Tavares',
    });
    const formattedContext = formatAssistantContextBlocks(blocks) || '';

    expect(formattedContext).toContain('[redacted-email]');
    expect(formattedContext).toContain('password: [redacted]');
    expect(formattedContext).toContain('biwenger_token: [redacted]');
    expect(formattedContext).not.toContain('carlos@example.com');
    expect(formattedContext).not.toContain('abc123');
    expect(formattedContext).not.toContain('token-123');
  });
});
