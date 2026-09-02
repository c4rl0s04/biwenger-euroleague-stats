import { beforeEach, describe, expect, it, vi } from 'vitest';

const feature = vi.hoisted(() => ({
  getTeamProfileData: vi.fn(),
  parseTeamProfileSection: vi.fn(),
}));
const mobile = vi.hoisted(() => ({ requireMobileRoute: vi.fn() }));

vi.mock('@/features/teams/server', () => feature);
vi.mock('@/features/teams/public', () => ({
  TeamProfileSectionScreen: 'team-profile-section-screen',
}));
vi.mock('@/lib/mobile/route-server', () => mobile);

import TeamSectionPage from './page';

describe('team profile mobile section entry point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    feature.getTeamProfileData.mockResolvedValue({ id: 7, name: 'Madrid' });
    feature.parseTeamProfileSection.mockReturnValue('roster');
    mobile.requireMobileRoute.mockResolvedValue({ definition: { title: 'Plantilla' } });
  });

  it('preserves the mobile route guard and delegates composition to the feature', async () => {
    const result = await TeamSectionPage({
      params: Promise.resolve({ id: '7', section: 'roster' }),
    });

    expect(mobile.requireMobileRoute).toHaveBeenCalledWith('/team/7/roster');
    expect(feature.getTeamProfileData).toHaveBeenCalledWith('7');
    expect(result?.type).toBe('team-profile-section-screen');
    expect(result?.props).toMatchObject({
      model: { id: 7, name: 'Madrid' },
      section: 'roster',
      title: 'Plantilla',
    });
  });

  it('preserves the empty response for missing teams or unsupported sections', async () => {
    feature.getTeamProfileData.mockResolvedValueOnce(null);
    await expect(
      TeamSectionPage({ params: Promise.resolve({ id: '999', section: 'roster' }) })
    ).resolves.toBeNull();

    feature.parseTeamProfileSection.mockReturnValueOnce(null);
    await expect(
      TeamSectionPage({ params: Promise.resolve({ id: '7', section: 'unknown' }) })
    ).resolves.toBeNull();
  });
});
