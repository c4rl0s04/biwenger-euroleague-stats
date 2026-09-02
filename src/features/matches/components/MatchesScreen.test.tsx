import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui', () => ({ PageHeader: 'page-header' }));
vi.mock('./desktop/MatchesClient', () => ({ default: 'matches-client' }));
vi.mock('./mobile/MobileMatchesScreen', () => ({ default: 'mobile-matches-screen' }));

import type { MatchesScreenViewModel } from '../models/match';
import { MatchesScreen } from './MatchesScreen';

const model: MatchesScreenViewModel = {
  rounds: [],
  currentRoundId: 3,
  selectedRoundId: 5,
};

describe('MatchesScreen', () => {
  it('preserves the current-round desktop default', () => {
    const screen = MatchesScreen({ model, presentation: 'desktop' });
    const matchesClient = screen.props.children[1];

    expect(matchesClient.type).toBe('matches-client');
    expect(matchesClient.props.defaultRoundId).toBe(3);
  });

  it('uses the requested round for the phone presentation', () => {
    const screen = MatchesScreen({ model, presentation: 'phone' });

    expect(screen.type).toBe('mobile-matches-screen');
    expect(screen.props.activeRoundId).toBe(5);
  });
});
