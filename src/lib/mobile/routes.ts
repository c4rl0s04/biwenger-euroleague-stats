export interface MobileRouteDefinition {
  href: string;
  parentHref?: string;
  desktopAnchor?: string;
  desktopTarget?: string;
  title: string;
  category: 'Inicio' | 'Equipo' | 'Liga' | 'Competición' | 'Herramientas' | 'Cuenta';
  navigationLabel: string;
}

export interface MobileRouteMatch {
  definition: MobileRouteDefinition;
  params: Record<string, string>;
}

const main = (
  href: string,
  title: string,
  category: MobileRouteDefinition['category'],
  navigationLabel = title
): MobileRouteDefinition => ({ href, title, category, navigationLabel });

const section = (
  href: string,
  parentHref: string,
  desktopAnchor: string,
  title: string,
  category: MobileRouteDefinition['category'],
  desktopTarget?: string
): MobileRouteDefinition => ({
  href,
  parentHref,
  desktopAnchor,
  desktopTarget,
  title,
  category,
  navigationLabel: title,
});

export const MOBILE_ROUTE_DEFINITIONS: readonly MobileRouteDefinition[] = [
  main('/', 'Inicio', 'Inicio'),
  main('/dashboard', 'Dashboard', 'Equipo'),
  section('/dashboard/season', '/dashboard', 'season', 'Mi temporada', 'Equipo'),
  section('/dashboard/comparison', '/dashboard', 'comparison', 'Comparativa', 'Equipo'),
  section('/dashboard/next-round', '/dashboard', 'next-round', 'Próxima jornada', 'Equipo'),
  section('/dashboard/market', '/dashboard', 'market', 'Mercado y jugadores', 'Equipo'),
  section('/dashboard/league', '/dashboard', 'league', 'Pulso de la liga', 'Liga'),

  main('/standings', 'Clasificación', 'Liga'),
  section('/standings/progression', '/standings', 'progression', 'Evolución', 'Liga'),
  section('/standings/rounds', '/standings', 'rounds', 'Jornadas', 'Liga'),
  section('/standings/draft', '/standings', 'draft', 'Draft inicial', 'Liga'),
  section('/standings/form', '/standings', 'form', 'Estado de forma', 'Liga'),
  section('/standings/performance', '/standings', 'performance', 'Rendimiento', 'Liga'),
  section('/standings/alternatives', '/standings', 'alternatives', 'Clasificaciones', 'Liga'),
  section('/standings/curiosities', '/standings', 'curiosities', 'Curiosidades', 'Liga'),
  section('/standings/captains', '/standings', 'captains', 'Capitanes', 'Liga'),

  main('/market', 'Mercado', 'Equipo'),
  section('/market/transfers', '/market', 'transfers', 'Fichajes', 'Equipo'),
  section('/market/investments', '/market', 'investments', 'Inversiones', 'Equipo'),
  section('/market/bids', '/market', 'bids', 'Pujas', 'Equipo'),
  section('/market/trends', '/market', 'trends', 'Tendencias', 'Equipo'),

  main('/players', 'Jugadores', 'Equipo'),
  section('/players/insights', '/players', 'insights', 'Análisis de jugadores', 'Equipo'),
  section('/players/squads', '/players', 'squads', 'Plantillas', 'Equipo'),
  main('/player/[id]', 'Perfil de jugador', 'Equipo'),
  section(
    '/player/[id]/performance',
    '/player/[id]',
    'performance',
    'Rendimiento',
    'Equipo',
    '/player/:id#performance'
  ),
  section(
    '/player/[id]/market',
    '/player/[id]',
    'market',
    'Mercado',
    'Equipo',
    '/player/:id#market'
  ),
  section(
    '/player/[id]/history',
    '/player/[id]',
    'history',
    'Historial',
    'Equipo',
    '/player/:id#history'
  ),

  main('/schedule', 'Horario', 'Equipo'),
  section('/schedule/map', '/schedule', 'map', 'Mapa de partidos', 'Equipo'),
  main('/lineup', 'Alineación', 'Equipo'),
  section('/lineup/squad', '/lineup', 'squad', 'Plantilla', 'Equipo'),
  section('/lineup/offers', '/lineup', 'offers', 'Ofertas', 'Equipo'),
  section('/lineup/analysis', '/lineup', 'analysis', 'Análisis', 'Equipo'),
  main('/matches', 'Partidos', 'Liga'),
  section(
    '/matches/round/[roundId]',
    '/matches',
    'round',
    'Partidos de la jornada',
    'Liga',
    '/matches?roundId=:roundId'
  ),
  main('/rounds', 'Jornadas', 'Liga'),
  section(
    '/rounds/[roundId]/lineup',
    '/rounds',
    'lineup',
    'Alineación de jornada',
    'Liga',
    '/rounds?roundId=:roundId#lineup'
  ),
  section(
    '/rounds/[roundId]/stats',
    '/rounds',
    'stats',
    'Estadísticas',
    'Liga',
    '/rounds?roundId=:roundId#stats'
  ),
  section(
    '/rounds/[roundId]/history',
    '/rounds',
    'history',
    'Historial',
    'Liga',
    '/rounds?roundId=:roundId#history'
  ),
  section(
    '/rounds/[roundId]/comparison',
    '/rounds',
    'comparison',
    'Comparación',
    'Liga',
    '/rounds?roundId=:roundId#comparison'
  ),

  main('/tournaments', 'Torneos', 'Competición'),
  main('/tournaments/[id]', 'Torneo', 'Competición'),
  section(
    '/tournaments/[id]/standings',
    '/tournaments/[id]',
    'standings',
    'Clasificación',
    'Competición',
    '/tournaments/:id#standings'
  ),
  section(
    '/tournaments/[id]/bracket',
    '/tournaments/[id]',
    'bracket',
    'Cuadro',
    'Competición',
    '/tournaments/:id#bracket'
  ),
  section(
    '/tournaments/[id]/results',
    '/tournaments/[id]',
    'results',
    'Resultados',
    'Competición',
    '/tournaments/:id#results'
  ),
  main('/predictions', 'Porras', 'Competición'),
  section('/predictions/evolution', '/predictions', 'evolution', 'Evolución', 'Competición'),
  section('/predictions/ranking', '/predictions', 'ranking', 'Ranking', 'Competición'),
  section('/predictions/teams', '/predictions', 'teams', 'Equipos', 'Competición'),
  section('/predictions/history', '/predictions', 'history', 'Historial', 'Competición'),
  main('/playoffs', 'Playoffs', 'Competición'),
  section(
    '/playoffs/predictions/[userId]',
    '/playoffs',
    'predictions',
    'Predicción',
    'Competición',
    '/playoffs?userId=:userId#predictions'
  ),

  main('/compare', 'Comparativa', 'Liga'),
  section(
    '/compare/[userId]',
    '/compare',
    'comparison',
    'Comparación completa',
    'Liga',
    '/compare?opponent=:userId'
  ),
  main('/assistant', 'Asistente', 'Herramientas'),
  section(
    '/assistant/[conversationId]',
    '/assistant',
    'conversation',
    'Conversación',
    'Herramientas',
    '/assistant?conversation=:conversationId'
  ),
  main('/hoopgrid', 'Hoopgrid', 'Herramientas'),
  main('/hoopgrid-cheatsheet', 'Cheatsheet', 'Herramientas'),

  main('/user/[id]', 'Perfil de mánager', 'Liga'),
  ...['season', 'squad', 'evolution', 'contributors', 'competitions'].map((slug) =>
    section(
      `/user/[id]/${slug}`,
      '/user/[id]',
      slug,
      {
        season: 'Temporada',
        squad: 'Plantilla',
        evolution: 'Evolución',
        contributors: 'Contribuidores',
        competitions: 'Competiciones',
      }[slug] ?? slug,
      'Liga',
      `/user/:id#${slug}`
    )
  ),
  main('/team/[id]', 'Perfil de equipo', 'Liga'),
  section(
    '/team/[id]/roster',
    '/team/[id]',
    'roster',
    'Plantilla',
    'Liga',
    '/team/:id#roster'
  ),
  section(
    '/team/[id]/matches',
    '/team/[id]',
    'matches',
    'Partidos',
    'Liga',
    '/team/:id#matches'
  ),

  main('/settings', 'Ajustes', 'Cuenta'),
  section('/settings/account', '/settings', 'account', 'Cuenta', 'Cuenta'),
  section('/settings/biwenger', '/settings', 'biwenger', 'Biwenger', 'Cuenta'),
  section('/settings/appearance', '/settings', 'appearance', 'Apariencia', 'Cuenta'),
  section('/settings/install', '/settings', 'install', 'Instalación', 'Cuenta'),
  main('/season-review', 'Análisis 25/26', 'Herramientas'),
  section('/season-review/real', '/season-review', 'real', 'Evolución real', 'Herramientas'),
  section('/season-review/limits', '/season-review', 'limits', 'Límites', 'Herramientas'),
  section(
    '/season-review/simulations',
    '/season-review',
    'simulations',
    'Simulaciones',
    'Herramientas'
  ),
  section(
    '/season-review/configurations',
    '/season-review',
    'configurations',
    'Configuraciones',
    'Herramientas'
  ),
  section(
    '/season-review/methodology',
    '/season-review',
    'methodology',
    'Metodología',
    'Herramientas'
  ),

  main('/login', 'Iniciar sesión', 'Cuenta'),
  main('/install', 'Instalar', 'Cuenta'),
  main('/offline', 'Sin conexión', 'Cuenta'),
];

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const names: string[] = [];
  const expression = pattern
    .split('/')
    .map((segment) => {
      const match = segment.match(/^\[([^\]]+)\]$/);
      if (!match) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      names.push(match[1]);
      return '([^/]+)';
    })
    .join('/');
  const matched = pathname.match(new RegExp(`^${expression}/?$`));
  if (!matched) return null;

  return Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(matched[index + 1])]));
}

export function findMobileRoute(pathname: string): MobileRouteMatch | null {
  for (const definition of MOBILE_ROUTE_DEFINITIONS) {
    const params = matchPattern(definition.href, pathname);
    if (params) return { definition, params };
  }
  return null;
}

function interpolate(target: string, params: Record<string, string>): string {
  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`:${name}`, encodeURIComponent(value)),
    target
  );
}

export function getDesktopDestination(pathname: string): string | null {
  const match = findMobileRoute(pathname);
  if (!match?.definition.parentHref) return null;

  const target =
    match.definition.desktopTarget ??
    `${match.definition.parentHref}${match.definition.desktopAnchor ? `#${match.definition.desktopAnchor}` : ''}`;

  return interpolate(target.replaceAll('[', ':').replaceAll(']', ''), match.params);
}
