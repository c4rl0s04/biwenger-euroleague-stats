/**
 * Biblioteca de Consultas SQL Optimizadas
 * Fuente de verdad para las consultas que el Agente AI puede usar.
 */
export const queryLibrary = [
  {
    category: 'MERCADO Y TENDENCIAS',
    queries: [
      {
        title: 'Top 5 Subidas de Precio (Últimos 14 días)',
        sql: `SELECT 
  p.name, p.price, 
  (p.price - (SELECT price FROM market_values WHERE player_id = p.id ORDER BY date ASC LIMIT 1)) as increase
FROM players p
WHERE p.status = 'ok'
ORDER BY increase DESC
LIMIT 5;`,
      },
      {
        title: 'Top 5 Bajadas de Precio',
        sql: `SELECT 
  p.name, p.price, 
  (p.price - (SELECT price FROM market_values WHERE player_id = p.id ORDER BY date ASC LIMIT 1)) as decrease
FROM players p
WHERE p.status = 'ok'
ORDER BY decrease ASC
LIMIT 5;`,
      },
    ],
  },
  {
    category: 'LÍDERES DE LA ÚLTIMA JORNADA',
    queries: [
      {
        title: 'MVP (Más puntos Fantasy)',
        sql: `SELECT p.name, t.short_name as team, prs.fantasy_points 
FROM player_round_stats prs
JOIN players p ON prs.player_id = p.id
JOIN teams t ON p.team_id = t.id
ORDER BY prs.round_id DESC, prs.fantasy_points DESC
LIMIT 1;`,
      },
      {
        title: 'Máximo Anotador (Puntos Reales)',
        sql: `SELECT p.name, prs.points as puntos_reales
FROM player_round_stats prs
JOIN players p ON prs.player_id = p.id
ORDER BY prs.round_id DESC, prs.points DESC
LIMIT 1;`,
      },
    ],
  },
  {
    category: 'RÉCORDS',
    queries: [
      {
        title: 'Puntuación Más Alta en una Jornada',
        sql: `SELECT u.name, ur.points, ur.round_name
FROM user_rounds ur
JOIN users u ON ur.user_id = u.id
ORDER BY ur.points DESC
LIMIT 1;`,
      },
    ],
  },
  {
    category: 'ESTADO DE JUGADORES',
    queries: [
      {
        title: "Jugadores 'GTD' (Game Time Decision)",
        sql: `SELECT name, team_id, status 
FROM players 
WHERE status = 'gtd';`,
      },
    ],
  },
];

export function formatLibraryAsText() {
  let output = 'BIBLIOTECA DE CONSULTAS SQL OPTIMIZADAS\n';
  output +=
    "Usa estas plantillas con la herramienta 'read_sql_query' para obtener datos avanzados sin inventar SQL.\n\n";

  queryLibrary.forEach((section, index) => {
    output += `--- ${index + 1}. ${section.category} ---\n\n`;
    section.queries.forEach((q) => {
      output += `# ${q.title}\n${q.sql}\n\n`;
    });
  });

  return output;
}
