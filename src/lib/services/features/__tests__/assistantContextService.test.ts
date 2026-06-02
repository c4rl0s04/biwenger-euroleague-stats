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
    fetchNextRound: vi.fn(),
    fetchTopPlayersByForm: vi.fn(),
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
    services.fetchNextRound.mockResolvedValue({ matches: [] });
    services.fetchTopPlayersByForm.mockResolvedValue([]);
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
      players: [
        { name: 'Tavares', team_short_name: 'RMA', position: 'C', points: 300, average: 15 },
        { name: 'Jugador en caída', price: 2000000, price_increment: -350000, average: 4 },
      ],
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
    const contextText = blocks.map((block) => block.content).join('\n');
    expect(contextText).toContain('Carlos');
    expect(contextText).toContain('Candidatos a venta');
    expect(contextText).toContain('Jugador en caída');
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
      users: [
        { id: '42', name: 'Carlos' },
        { id: '7', name: 'Andrés' },
        { id: '99', name: 'No mencionado' },
      ],
      standings: [
        { id: '42', name: 'Carlos', total_points: 900 },
        { id: '7', name: 'Andrés', total_points: 875 },
        { id: '99', name: 'No mencionado', total_points: 1000 },
      ],
      predictions: { promedios: [] },
    });
    services.fetchEfficiencyStats.mockResolvedValue([
      { id: '42', name: 'Carlos', efficiency: 91 },
      { id: '7', name: 'Andrés', efficiency: 88 },
      { id: '99', name: 'No mencionado', efficiency: 99 },
    ]);

    const blocks = await buildAssistantContext({
      userId: '42',
      message: 'Compárame con Andrés',
    });
    const contextText = blocks.map((block) => block.content).join('\n');

    expect(getAssistantContextProviderNamesForMessage('Compárame con Andrés')).toContain('compare');
    expect(services.getCompareDataLite).toHaveBeenCalled();
    expect(blocks.some((block) => block.label === 'Comparison context')).toBe(true);
    expect(contextText).toContain('Managers mencionados en la pregunta: Andrés');
    expect(contextText).toContain('Carlos');
    expect(contextText).toContain('Andrés');
    expect(contextText).not.toContain('No mencionado: 99');
  });

  it('logs selected providers only in development', async () => {
    const { buildAssistantContext } =
      await import('@/lib/services/features/assistantContextService');
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'development');

    await buildAssistantContext({
      userId: '42',
      message: '¿Qué oportunidades hay en mercado?',
    });

    expect(debugSpy).toHaveBeenCalledWith('[Assistant Context] selected providers:', ['market']);

    debugSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('adds prediction context for projection questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    services.fetchUserSquadDetails.mockResolvedValue({
      players: [
        {
          id: '10',
          name: 'Tavares',
          average: 14,
          recent_scores: '18,12,20',
          price_increment: 500000,
        },
      ],
    });
    services.getUserScheduleService.mockResolvedValue({
      round: { round_name: 'Jornada 20' },
      matches: [
        {
          home_id: 1,
          away_id: 2,
          home_team: 'Real Madrid',
          away_team: 'Barça',
          user_players: [
            { id: '10', name: 'Tavares', team_id: 1, opponent: 'Barça', is_home: true },
          ],
        },
      ],
      userPlayers: [],
    });
    services.fetchNextRound.mockResolvedValue({
      matches: [{ home_id: 1, away_id: 2, home_position: 3, away_position: 14 }],
    });
    services.fetchCaptainRecommendations.mockResolvedValue([
      {
        name: 'Tavares',
        avg_recent_points: 16.7,
        recent_games: 3,
        form_label: 'Buena forma',
      },
    ]);
    services.fetchMarketOpportunities.mockResolvedValue([
      { name: 'Jugador mercado', recommendation_score: 82, avg_recent_points: 14, price: 1000 },
    ]);
    services.fetchTopPlayersByForm.mockResolvedValue([
      { name: 'Top forma', avg_points: 20, recent_scores: '22,18,20' },
    ]);

    const blocks = await buildAssistantContext({
      userId: '42',
      message: 'Predice cuántos puntos puede hacer mi plantilla',
    });
    const contextText = blocks.map((block) => block.content).join('\n');

    expect(
      getAssistantContextProviderNamesForMessage('Predice cuántos puntos puede hacer mi plantilla')
    ).toContain('predictions');
    expect(services.fetchUserSquadDetails).toHaveBeenCalledWith('42');
    expect(services.fetchTopPlayersByForm).toHaveBeenCalledWith(8, 3);
    expect(blocks.some((block) => block.label === 'Prediction context')).toBe(true);
    expect(contextText).toContain('Modelo usado: heurística transparente');
    expect(contextText).toContain('Tavares: proyección');
    expect(contextText).toContain('confianza alta');
    expect(contextText).toContain('dificultad Fácil');
    expect(contextText).toContain('posición rival 14');
    expect(contextText).toContain('Oportunidades predictivas de mercado');
  });

  it('adds recommended lineup context for lineup questions', async () => {
    const { buildAssistantContext, getAssistantContextProviderNamesForMessage } =
      await import('@/lib/services/features/assistantContextService');
    services.fetchUserSquadDetails.mockResolvedValue({
      players: [
        {
          id: '1',
          name: 'Base fuerte',
          position: 'Base',
          average: 14,
          recent_scores: '18,16,14',
          price_increment: 300000,
        },
        {
          id: '2',
          name: 'Alero sólido',
          position: 'Alero',
          average: 12,
          recent_scores: '12,13,11',
        },
        {
          id: '3',
          name: 'Pivot top',
          position: 'Pivot',
          average: 16,
          recent_scores: '20,18,15',
        },
        {
          id: '4',
          name: 'Base dos',
          position: 'Base',
          average: 10,
          recent_scores: '9,11,10',
        },
        {
          id: '5',
          name: 'Alero dos',
          position: 'Alero',
          average: 9,
          recent_scores: '8,10,9',
        },
        {
          id: '6',
          name: 'Pivot sexto',
          position: 'Pivot',
          average: 8,
          recent_scores: '8,8,9',
        },
      ],
    });
    services.getUserScheduleService.mockResolvedValue({
      round: { round_name: 'Jornada 20' },
      matches: [
        {
          home_id: 1,
          away_id: 2,
          home_team: 'RMA',
          away_team: 'BAR',
          user_players: [
            { id: '1', name: 'Base fuerte', team_id: 1, opponent: 'BAR', is_home: true },
            { id: '2', name: 'Alero sólido', team_id: 1, opponent: 'BAR', is_home: true },
            { id: '3', name: 'Pivot top', team_id: 1, opponent: 'BAR', is_home: true },
            { id: '4', name: 'Base dos', team_id: 1, opponent: 'BAR', is_home: true },
            { id: '5', name: 'Alero dos', team_id: 1, opponent: 'BAR', is_home: true },
            { id: '6', name: 'Pivot sexto', team_id: 1, opponent: 'BAR', is_home: true },
          ],
        },
      ],
      userPlayers: [],
    });
    services.fetchNextRound.mockResolvedValue({
      matches: [{ home_id: 1, away_id: 2, home_position: 2, away_position: 4 }],
    });
    services.fetchCaptainRecommendations.mockResolvedValue([
      { name: 'Pivot top', avg_recent_points: 17.7, form_label: 'Buena forma' },
    ]);

    const blocks = await buildAssistantContext({
      userId: '42',
      message: '¿Qué alineación pongo y quién de capitán?',
    });
    const contextText = blocks.map((block) => block.content).join('\n');

    expect(
      getAssistantContextProviderNamesForMessage('¿Qué alineación pongo y quién de capitán?')
    ).toContain('lineup_recommendation');
    expect(blocks.some((block) => block.label === 'Recommended lineup context')).toBe(true);
    expect(contextText).toContain('Puntos esperados alineación');
    expect(contextText).toContain('Capitán recomendado');
    expect(contextText).toContain('Titulares recomendados');
    expect(contextText).toContain('Sexto hombre recomendado');
    expect(contextText).toContain('rival difícil');
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
