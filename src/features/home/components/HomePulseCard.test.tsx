import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import HomePulseCard from './HomePulseCard';

describe('mobile home pulse', () => {
  it('shows exact points and explicit compact money units', () => {
    const html = renderToStaticMarkup(
      <HomePulseCard
        summary={{
          seasonId: '2025-26',
          seasonName: 'Temporada 2025/26',
          phase: 'active',
          user: {
            id: '7',
            name: 'All Stars',
            position: 1,
            totalPoints: 8256,
            teamValue: 94_400_000,
            priceTrend: -550_000,
          },
          round: {
            id: 4,
            name: 'Eliminatoria 4',
            status: 'live',
            startsAt: null,
          },
          alerts: [],
        }}
      />
    );

    expect(html).toContain('8.256');
    expect(html).not.toContain('8.256 pts');
    expect(html).toContain('94,4 M€');
    expect(html).toContain('550 mil €');
    expect(html).not.toContain('8,3 mil');
  });
});
