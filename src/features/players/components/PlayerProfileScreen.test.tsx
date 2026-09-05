import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui', () => ({ ThemeBackground: 'theme-background' }));
vi.mock('./desktop/profile/PlayerProfileClient', () => ({ default: 'player-profile-client' }));
vi.mock('./mobile/MobilePlayerProfileScreen', () => ({ default: 'mobile-player-profile-screen' }));

import type { PlayerProfileViewModel } from '../models/player-profile';
import { PlayerProfileNotFoundScreen, PlayerProfileScreen } from './PlayerProfileScreen';

const player = {
  id: 7,
  name: 'Player Seven',
  recentMatches: [],
  priceHistory: [],
  transfers: [],
  nextMatch: null,
  nextMatches: [],
  advancedStats: {},
} as unknown as PlayerProfileViewModel;

describe('PlayerProfileScreen', () => {
  it('keeps the desktop composition around the normalized model', () => {
    const screen = PlayerProfileScreen({ player, phone: false });
    const client = screen.props.children[1].props.children;

    expect(screen.props.children[0].props.children.type).toBe('theme-background');
    expect(client.type).toBe('player-profile-client');
    expect(client.props.player).toBe(player);
  });

  it('passes the same information model to the phone composition', () => {
    const screen = PlayerProfileScreen({ player, phone: true });

    expect(screen.type).toBe('mobile-player-profile-screen');
    expect(screen.props.player).toBe(player);
  });

  it('preserves the existing not-found copy and dashboard link', () => {
    const screen = PlayerProfileNotFoundScreen();
    const link = screen.props.children[1];

    expect(screen.props.children[0].props.children).toBe('Jugador no encontrado');
    expect(link.props.href).toBe('/dashboard');
  });
});
