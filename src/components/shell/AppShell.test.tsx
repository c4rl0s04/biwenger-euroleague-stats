import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./desktop/DesktopShell', () => ({
  DesktopShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="desktop-shell">{children}</div>
  ),
}));

vi.mock('./mobile/MobileShell', () => ({
  MobileShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-shell">{children}</div>
  ),
}));

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders skip-to-content accessibility link pointing to #main-content', () => {
    const html = renderToStaticMarkup(<AppShell>Main content</AppShell>);
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('Saltar al contenido');
  });

  it('renders desktop shell by default with desktop data-presentation attribute', () => {
    const html = renderToStaticMarkup(<AppShell>Desktop body</AppShell>);
    expect(html).toContain('data-presentation="desktop"');
    expect(html).toContain('data-testid="desktop-shell"');
    expect(html).not.toContain('data-testid="mobile-shell"');
    expect(html).toContain('Desktop body');
  });

  it('renders mobile shell when presentationMode is phone', () => {
    const html = renderToStaticMarkup(<AppShell presentationMode="phone">Mobile body</AppShell>);
    expect(html).toContain('data-presentation="phone"');
    expect(html).toContain('data-testid="mobile-shell"');
    expect(html).not.toContain('data-testid="desktop-shell"');
    expect(html).toContain('Mobile body');
  });
});
