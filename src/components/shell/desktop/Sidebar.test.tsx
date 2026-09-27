import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockPathname = '/';
let mockSections: Array<{ id: string; title: string }> = [];

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('../shared/SectionContext', () => ({
  useSections: () => ({
    sections: mockSections,
    registerSection: vi.fn(),
    unregisterSection: vi.fn(),
  }),
}));

import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    mockPathname = '/';
    mockSections = [];
  });

  it('renders navigation landmark with accessible label', () => {
    const html = renderToStaticMarkup(<Sidebar />);
    expect(html).toContain('aria-label="Navegación principal"');
    expect(html).toContain('Colapsar barra lateral');
  });

  it('renders all canonical navigation destinations and marks active page', () => {
    mockPathname = '/market';
    const html = renderToStaticMarkup(<Sidebar />);

    expect(html).toContain('Inicio');
    expect(html).toContain('Mercado');
    expect(html).toContain('Jugadores');
    expect(html).toContain('Clasificación');

    // Mercado should have aria-current="page"
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/market"');
  });

  it('renders dynamic page sections for active route when sections exist', () => {
    mockPathname = '/market';
    mockSections = [
      { id: 'bidding', title: 'Pujas activas' },
      { id: 'trends', title: 'Tendencias de mercado' },
    ];

    const html = renderToStaticMarkup(<Sidebar />);
    expect(html).toContain('href="/market#bidding"');
    expect(html).toContain('Pujas activas');
    expect(html).toContain('href="/market#trends"');
    expect(html).toContain('Tendencias de mercado');
  });
});
