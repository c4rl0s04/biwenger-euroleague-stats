import { beforeEach, describe, expect, it, vi } from 'vitest';

const feature = vi.hoisted(() => ({ getTeamProfileData: vi.fn() }));
const presentation = vi.hoisted(() => ({ isPhonePresentation: vi.fn() }));

vi.mock('@/features/teams/server', () => feature);
vi.mock('@/features/teams/public', () => ({
  TeamProfileNotFoundScreen: 'team-profile-not-found',
  TeamProfileScreen: 'team-profile-screen',
}));
vi.mock('@/lib/mobile/presentation-server', () => presentation);

import TeamPage from './page';

describe('team profile page entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feature.getTeamProfileData.mockResolvedValue({ id: 7, name: 'Madrid' });
    presentation.isPhonePresentation.mockResolvedValue(false);
  });

  it('delegates reads to the Team service and chooses the existing presentation', async () => {
    const result = await TeamPage({ params: Promise.resolve({ id: '7' }) });

    expect(feature.getTeamProfileData).toHaveBeenCalledWith('7');
    expect(result.type).toBe('team-profile-screen');
    expect(result.props.presentation).toBe('desktop');
    expect(result.props.model).toEqual({ id: 7, name: 'Madrid' });
  });

  it('preserves the custom Team not-found screen', async () => {
    feature.getTeamProfileData.mockResolvedValueOnce(null);

    const result = await TeamPage({ params: Promise.resolve({ id: '999' }) });

    expect(result.type).toBe('team-profile-not-found');
  });
});
