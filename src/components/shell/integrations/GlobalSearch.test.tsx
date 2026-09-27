import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../shared/NavigationFeedback', () => ({
  useNavigationFeedback: () => ({
    beginNavigation: vi.fn(),
  }),
}));

import { GlobalSearch } from './GlobalSearch';

describe('GlobalSearch', () => {
  it('renders search input with accessible label and placeholder', () => {
    const html = renderToStaticMarkup(<GlobalSearch />);
    expect(html).toContain('aria-label="Buscar jugadores, equipos y mánagers"');
    expect(html).toContain('placeholder="Buscar..."');
    expect(html).toContain('type="text"');
  });

  it('forwards custom className to outer container', () => {
    const html = renderToStaticMarkup(<GlobalSearch className="custom-search-test" />);
    expect(html).toContain('custom-search-test');
  });
});
