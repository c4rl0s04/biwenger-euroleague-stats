import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import DraftFidelityCard from './DraftFidelityCard';
import VolatilityCard from './VolatilityCard';

vi.mock('@/lib/competition/ui', () => ({
  ManagerIdentity: ({ manager }: { manager: { id: string | number | null; name: string } }) => (
    <a href={`/user/${manager.id}`}>{manager.name}</a>
  ),
}));
vi.mock('@/components/ui', () => ({
  Card: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
const fixture = vi.hoisted(() => ({ data: {} as unknown }));
vi.mock('@/lib/hooks/useApiData', () => ({
  useApiData: () => ({ data: fixture.data, loading: false, error: null }),
}));
it('keeps player contributions behind an accessible trigger outside the manager link', () => {
  fixture.data = {
    retainedRanking: [
      { user_id: 0, user_name: 'Manager Zero', total_points: 0, players_contributed: 1 },
    ],
    retainedBreakdown: [{ user_name: 'Manager Zero', player_name: 'Contributor', points: 12 }],
  };
  const html = renderToStaticMarkup(<DraftFidelityCard />);
  expect(html).toContain('href="/user/0"');
  expect(html).toContain('aria-label="Aportación por jugador de Manager Zero"');
  expect(html).toContain('Contributor');
  expect(html).toContain('12 pts');
  expect(html.indexOf('</a>')).toBeLessThan(html.indexOf('<button'));
});
it('renders zero volatility with a finite empty indicator and preserves the mean', () => {
  fixture.data = [{ user_id: 7, name: 'Steady', std_dev: 0, avg_points: 50 }];
  const html = renderToStaticMarkup(<VolatilityCard />);
  expect(html).toContain('width:0%');
  expect(html).toContain('Media: 50');
  expect(html).not.toContain('NaN');
});
