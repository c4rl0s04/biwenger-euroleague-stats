import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockPathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('../shared/NavigationFeedback', () => ({
  useNavigationFeedback: () => ({
    isNavigatingTo: () => false,
    navigateWithFeedback: vi.fn(),
  }),
  NavigationLink: ({
    children,
    href,
    className,
    'aria-current': ariaCurrent,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | boolean;
  }) => (
    <a href={href} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

vi.mock('../integrations/GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search" />,
}));

vi.mock('../integrations/SeasonSelector', () => ({
  SeasonSelector: () => <div data-testid="season-selector" />,
}));

import { MobileNavigation } from './MobileNavigation';
import { MobileMoreMenu } from './MobileMoreMenu';

describe('MobileNavigation', () => {
  beforeEach(() => {
    mockPathname = '/';
  });

  it('renders bottom navigation landmark with accessible label', () => {
    const html = renderToStaticMarkup(<MobileNavigation />);
    expect(html).toContain('aria-label="Navegación principal móvil"');
  });

  it('renders primary mobile destinations and marks active primary route', () => {
    mockPathname = '/standings';
    const html = renderToStaticMarkup(<MobileNavigation />);

    expect(html).toContain('href="/standings"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Inicio');
    expect(html).toContain('Horario');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Clasificación');
    expect(html).toContain('Más');
  });

  it('activates the "Más" button when on a secondary route', () => {
    mockPathname = '/market';
    const html = renderToStaticMarkup(<MobileNavigation />);

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toMatch(
      /<button[^>]*class="[^"]*mobile-nav-item-active[^"]*"[^>]*>[\s\S]*?Más[\s\S]*?<\/button>/
    );
  });

  it('renders accessible dialog in MobileMoreMenu when open', () => {
    const html = renderToStaticMarkup(<MobileMoreMenu isOpen={true} onClose={() => {}} />);

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('id="mobile-more-title"');
    expect(html).toContain('Más secciones');
    expect(html).toContain('Cerrar menú');
  });
});
