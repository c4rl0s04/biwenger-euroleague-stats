import { beforeEach, describe, expect, it, vi } from 'vitest';

const feature = vi.hoisted(() => ({ getMatchesScreenData: vi.fn() }));
const presentation = vi.hoisted(() => ({ isPhonePresentation: vi.fn() }));

vi.mock('@/features/matches/server', () => feature);
vi.mock('@/features/matches/public', () => ({ MatchesScreen: 'matches-screen' }));
vi.mock('@/lib/mobile/presentation-server', () => presentation);

import MatchesPage from './page';

describe('matches page entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feature.getMatchesScreenData.mockResolvedValue({
      rounds: [],
      currentRoundId: null,
      selectedRoundId: null,
    });
    presentation.isPhonePresentation.mockResolvedValue(false);
  });

  it('delegates data orchestration to the feature service and renders the feature screen', async () => {
    const result = await MatchesPage({ searchParams: Promise.resolve({ roundId: '4' }) });

    expect(feature.getMatchesScreenData).toHaveBeenCalledWith('4');
    expect(result.type).toBe('matches-screen');
    expect(result.props.presentation).toBe('desktop');
    expect(result.props.model).toEqual({
      rounds: [],
      currentRoundId: null,
      selectedRoundId: null,
    });
  });
});
