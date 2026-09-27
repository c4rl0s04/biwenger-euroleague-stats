import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockClientUserState = {
  currentUser: null as { id: string; name: string; icon?: string | null } | null,
  isClient: true,
  isAuthenticated: false,
};

vi.mock('@/lib/hooks/useClientUser', () => ({
  useClientUser: () => mockClientUserState,
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('../shared/NavigationFeedback', () => ({
  NavigationLink: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { AccountMenu } from './AccountMenu';

describe('AccountMenu', () => {
  beforeEach(() => {
    mockClientUserState = {
      currentUser: null,
      isClient: true,
      isAuthenticated: false,
    };
  });

  it('renders nothing on SSR to prevent hydration discrepancy (React #418)', () => {
    mockClientUserState.isClient = false;
    const html = renderToStaticMarkup(<AccountMenu />);
    expect(html).toBe('');
  });

  it('renders "Acceso Manager" login link when unauthenticated', () => {
    mockClientUserState.isAuthenticated = false;
    mockClientUserState.isClient = true;
    const html = renderToStaticMarkup(<AccountMenu />);

    expect(html).toContain('href="/login"');
    expect(html).toContain('Acceso Manager');
  });

  it.each([
    ['Fixture Manager', 'F'],
    ['  Carlos H ', 'C'],
    ['', '?'],
  ])('renders a compact avatar fallback for %j', (name, initial) => {
    mockClientUserState.isAuthenticated = true;
    mockClientUserState.currentUser = { id: '12345', name, icon: null };
    const html = renderToStaticMarkup(<AccountMenu />);
    expect(html).toMatch(
      new RegExp('aria-label="[^"]+">' + (initial === '?' ? '\\?' : initial) + '</span>')
    );
    expect(html).not.toContain('<img');
  });

  it('renders user button and avatar when authenticated', () => {
    mockClientUserState.isAuthenticated = true;
    mockClientUserState.isClient = true;
    mockClientUserState.currentUser = {
      id: '12345',
      name: 'Carlos H',
      icon: 'https://example.com/avatar.jpg',
    };

    const html = renderToStaticMarkup(<AccountMenu />);
    expect(html).toContain('Carlos H');
    expect(html).toContain('aria-label="Abrir perfil"');
    expect(html).toContain('aria-haspopup="true"');
    expect(html).toContain('aria-expanded="false"');
  });
});
