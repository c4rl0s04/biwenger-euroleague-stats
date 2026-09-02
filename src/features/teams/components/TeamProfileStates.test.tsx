import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui', () => ({
  BackButton: ({ label }: { label: string }) => <a>{label}</a>,
  ElegantCard: ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

import { TeamProfileLoadingScreen, TeamProfileNotFoundScreen } from './TeamProfileStates';
import TeamMatchesCard from './desktop/TeamMatchesCard';
import TeamRosterCard from './desktop/TeamRosterCard';

describe('Team Profile states', () => {
  it('preserves loading and not-found feedback', () => {
    expect(renderToStaticMarkup(<TeamProfileLoadingScreen />)).toContain('animate-pulse');
    const notFound = renderToStaticMarkup(<TeamProfileNotFoundScreen />);
    expect(notFound).toContain('Equipo no encontrado');
    expect(notFound).toContain('Volver atrás');
  });

  it('preserves empty roster and match messages', () => {
    expect(renderToStaticMarkup(<TeamRosterCard roster={[]} />)).toContain(
      'No hay jugadores registrados en este equipo.'
    );
    const matches = renderToStaticMarkup(<TeamMatchesCard upcoming={[]} recent={[]} />);
    expect(matches).toContain('No hay partidos programados');
    expect(matches).toContain('No hay resultados recientes');
  });
});
