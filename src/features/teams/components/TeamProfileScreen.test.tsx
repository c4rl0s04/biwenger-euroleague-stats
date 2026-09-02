import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui', () => ({ ThemeBackground: 'theme-background' }));
vi.mock('./desktop/TeamProfileClient', () => ({ default: 'team-profile-client' }));
vi.mock('./mobile/MobileTeamProfileScreen', () => ({ default: 'mobile-team-profile-screen' }));

import type { TeamProfileViewModel } from '../models/team-profile';
import { TeamProfileScreen } from './TeamProfileScreen';

const model: TeamProfileViewModel = {
  id: 7,
  name: 'Madrid',
  shortName: 'MAD',
  logoUrl: '/madrid.png',
  metrics: {
    totalFantasyPoints: 0,
    totalRealPoints: 0,
    averagePir: 0,
    totalValue: 0,
    rosterSize: 0,
    matchesPlayed: 0,
    playoffProbability: 0,
    wins: 0,
    losses: 0,
    rank: 0,
  },
  roster: [],
  upcomingMatches: [],
  recentMatches: [],
};

describe('TeamProfileScreen', () => {
  it('keeps the existing desktop composition around the normalized model', () => {
    const screen = TeamProfileScreen({ model, presentation: 'desktop' });
    const client = screen.props.children[1].props.children;

    expect(screen.props.children[0].props.children.type).toBe('theme-background');
    expect(client.type).toBe('team-profile-client');
    expect(client.props.team).toBe(model);
  });

  it('passes the same information model to the phone composition', () => {
    const screen = TeamProfileScreen({ model, presentation: 'phone' });

    expect(screen.type).toBe('mobile-team-profile-screen');
    expect(screen.props.team).toBe(model);
  });
});
