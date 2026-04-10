import { z } from 'zod';
import { db } from '@/lib/db/client';
import * as marketQueries from '@/lib/db/queries/features/market';

/**
 * Registers all tools (executable actions) to the MCP server.
 * Tools allow the AI to interact with the database and perform logic.
 */
export function registerTools(server) {
  console.log('🛠️ Registrando Herramientas (Acciones)...');

  // ------------------------------------------------------------------
  // HERRAMIENTA 1: BÚSQUEDA DE JUGADORES (Utility)
  // ------------------------------------------------------------------

  server.tool(
    'search_players',
    'Buscar jugadores por nombre (búsqueda difusa). Útil para encontrar el ID antes de analizar.',
    {
      query: z.string().describe('Nombre o parte del nombre del jugador a buscar'),
      limit: z.number().optional().describe('Número máximo de resultados (default: 5)'),
    },
    async ({ query, limit = 5 }) => {
      try {
        const sql = `
          SELECT 
            p.id, 
            p.name, 
            p.position, 
            p.price, 
            p.price_increment,
            p.status,
            p.puntos as total_points,
            p.partidos_jugados as played_games,
            t.name as team_name,
            (
              SELECT AVG(fantasy_points)
              FROM (
                SELECT fantasy_points 
                FROM player_round_stats 
                WHERE player_id = p.id 
                ORDER BY round_id DESC 
                LIMIT 5
              ) as recent
            ) as last_5_avg
          FROM players p
          LEFT JOIN teams t ON p.team_id = t.id
          WHERE p.name ILIKE $1
          ORDER BY p.price DESC
          LIMIT $2
        `;

        const result = await db.query(sql, [`%${query}%`, limit]);

        if (result.rows.length === 0) {
          return {
            content: [{ type: 'text', text: `No se encontraron jugadores con: "${query}"` }],
          };
        }

        const playersList = result.rows
          .map((p) => {
            const avgSeason =
              p.played_games > 0 ? (p.total_points / p.played_games).toFixed(1) : '0.0';
            const avgLast5 = p.last_5_avg ? Number(p.last_5_avg).toFixed(1) : '-';
            const priceChange =
              p.price_increment >= 0
                ? `+€${p.price_increment.toLocaleString()}`
                : `-€${Math.abs(p.price_increment).toLocaleString()}`;

            return `- [ID: ${p.id}] **${p.name}** (${p.position}) | ${p.team_name || 'Sin Equipo'}
    💰 €${(p.price || 0).toLocaleString()} (${priceChange})
    📊 Media: ${avgSeason} (Últimos 5: ${avgLast5}) | Estado: ${p.status}`;
          })
          .join('\n\n');

        return {
          content: [{ type: 'text', text: `Resultados para "${query}":\n\n${playersList}` }],
        };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error al buscar: ${error.message}` }] };
      }
    }
  );

  server.tool(
    'get_player_details',
    'Obtener análisis detallado de un jugador (ID requerido). Incluye stats recientes, mercado y calendario.',
    {
      player_id: z.number().describe('ID del jugador a analizar'),
    },
    async ({ player_id }) => {
      try {
        // 1. Perfil Básico (players + teams)
        const profileSql = `
          SELECT p.*, t.name as team_name 
          FROM players p 
          LEFT JOIN teams t ON p.team_id = t.id 
          WHERE p.id = $1
        `;
        const profileRes = await db.query(profileSql, [player_id]);
        if (profileRes.rows.length === 0)
          return { content: [{ type: 'text', text: 'Jugador no encontrado.' }] };
        const p = profileRes.rows[0];

        // 2. Estadísticas de Temporada (Calculadas desde player_round_stats para precisión)
        const seasonStatsSql = `
          SELECT 
            COUNT(*) as games_played, 
            ROUND(AVG(fantasy_points), 1) as avg_fantasy, 
            ROUND(AVG(points), 1) as avg_points 
          FROM player_round_stats 
          WHERE player_id = $1
        `;
        const seasonStatsRes = await db.query(seasonStatsSql, [player_id]);
        const sStats = seasonStatsRes.rows[0];

        // 3. Últimos 5 Partidos
        const last5Sql = `
          SELECT 
            prs.round_id, 
            prs.fantasy_points, 
            prs.points, 
            prs.rebounds, 
            prs.assists, 
            prs.valuation
          FROM player_round_stats prs
          WHERE prs.player_id = $1
          ORDER BY prs.round_id DESC
          LIMIT 5
        `;
        const last5Res = await db.query(last5Sql, [player_id]);

        const last5Text = last5Res.rows
          .map(
            (s) =>
              `- J.${s.round_id}: **${s.fantasy_points} pts** (Val: ${s.valuation}, P: ${s.points}, R: ${s.rebounds}, A: ${s.assists})`
          )
          .join('\n');

        // 4. Mercado (Últimos 14 días) - Min/Max y Tendencia
        const marketSql = `
          SELECT price, date 
          FROM market_values 
          WHERE player_id = $1 
          ORDER BY date DESC 
          LIMIT 14
        `;
        const marketRes = await db.query(marketSql, [player_id]);
        let marketText = 'Sin datos recientes.';
        if (marketRes.rows.length > 0) {
          const prices = marketRes.rows.map((m) => m.price);
          const current = prices[0];
          const max = Math.max(...prices);
          const min = Math.min(...prices);
          const oldest = prices[prices.length - 1];
          const trend =
            current > oldest ? '↗ (Subiendo)' : current < oldest ? '↘ (Bajando)' : '→ (Estable)';

          marketText = `• Actual: €${current.toLocaleString()}\n• Máx: €${max.toLocaleString()} | Mín: €${min.toLocaleString()}\n• Tendencia 14d: ${trend}`;
        }

        // 5. Próximos Partidos
        const nextMatchSql = `
          SELECT m.date, m.round_name, 
            CASE WHEN m.home_id = $1 THEN t_away.name ELSE t_home.name END as opponent
          FROM matches m
          JOIN teams t_home ON m.home_id = t_home.id
          JOIN teams t_away ON m.away_id = t_away.id
          WHERE (m.home_id = $2 OR m.away_id = $2)
          AND m.status != 'finished'
          ORDER BY m.date ASC
          LIMIT 2
        `;
        const nextMatchRes = await db.query(nextMatchSql, [p.team_id, p.team_id]);
        const scheduleText =
          nextMatchRes.rows.length > 0
            ? nextMatchRes.rows
                .map(
                  (m) =>
                    `- ${m.round_name}: vs ${m.opponent} (${new Date(m.date).toLocaleDateString()})`
                )
                .join('\n')
            : 'Sin partidos próximos.';

        // Output Final Formateado
        const response = `ANÁLISIS DE JUGADOR: **${p.name}**
--------------------------------------------------
👤 **PERFIL**
• Equipo: ${p.team_name || 'Sin Equipo'}
• Posición: ${p.position}
• Precio: €${p.price.toLocaleString()} (${p.price_increment >= 0 ? '+' : ''}€${(p.price_increment || 0).toLocaleString()})
• Estado: ${p.status}
  
📊 **ESTADÍSTICAS (Temp. 2024/25)**
• Media Fantasy: **${sStats.avg_fantasy || 0}** pts
• Media Puntos: ${sStats.avg_points || 0} pts
• Partidos Jugados: ${sStats.games_played}
  
📈 **FORMA (Últimos 5)**
${last5Text || 'Sin datos recientes.'}
  
💰 **MERCADO (14 Días)**
${marketText}
  
📅 **PRÓXIMOS RIVALES**
${scheduleText}`;

        return { content: [{ type: 'text', text: response }] };
      } catch (error) {
        console.error(`[get_player_details] Error: ${error.message}`);
        return { content: [{ type: 'text', text: `Error al analizar jugador: ${error.message}` }] };
      }
    }
  );

  // ------------------------------------------------------------------
  // HERRAMIENTA 3: READ SQL QUERY (Consulta Flexible y Segura)
  // ------------------------------------------------------------------
  server.tool(
    'read_sql_query',
    'Ejecuta consultas SQL de solo lectura para análisis complejos. ÚSALO SOLO SI OTRAS HERRAMIENTAS NO SIRVEN. Solo permite SELECT/WITH.',
    {
      query: z.string().describe('La consulta SQL a ejecutar. NO incluyas markdown (```sql).'),
    },
    async ({ query }) => {
      // 1. Normalización y Limpieza
      const sql = query.trim().replace(/;$/, ''); // Quitar punto y coma final si existe

      // 2. Validación de Seguridad Estricta
      const forbiddenKeywords =
        /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|COMMIT|ROLLBACK)\b/i;
      if (forbiddenKeywords.test(sql)) {
        return {
          content: [
            {
              type: 'text',
              text: '❌ ERROR: Solo se permiten consultas de lectura (SELECT/WITH). Modificaciones prohibidas.',
            },
          ],
          isError: true,
        };
      }

      if (!/^\s*(SELECT|WITH)/i.test(sql)) {
        return {
          content: [
            { type: 'text', text: '❌ ERROR: La consulta debe comenzar con SELECT o WITH.' },
          ],
          isError: true,
        };
      }

      try {
        // 3. Ejecución
        const result = await db.query(sql);

        // 4. Formato de Respuesta
        if (result.rows.length === 0) {
          return { content: [{ type: 'text', text: 'La consulta no devolvió resultados.' }] };
        }

        // Convertir a JSON string formateado para que el LLM lo pueda leer bien
        return {
          content: [{ type: 'text', text: JSON.stringify(result.rows, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error SQL: ${error.message}` }],
          isError: true,
        };
      }
    }
  );

  server.tool(
    'get_server_status',
    'Verifica si el servidor MCP está online y conectado.',
    {},
    async () => ({
      content: [{ type: 'text', text: '✅ Servidor Online y Esquema Cargado' }],
    })
  );
  // ------------------------------------------------------------------
  // HERRAMIENTA 4: OPORTUNIDADES DE MERCADO (Lógica de Negocio)
  // ------------------------------------------------------------------
  server.tool(
    'get_market_opportunities',
    "Identifica jugadores infravalorados con buena forma reciente ('Chollos').",
    {
      limit: z.number().optional().describe('Número de oportunidades (default: 3)'),
    },
    async ({ limit = 3 }) => {
      try {
        const opps = await marketQueries.getMarketOpportunities(limit);
        if (!opps.length)
          return { content: [{ type: 'text', text: 'No se encontraron oportunidades claras.' }] };

        const text = opps
          .map(
            (p) =>
              `- **${p.name}** (${p.team}) | Precio: €${p.price.toLocaleString()} (${p.price_trend >= 0 ? '↗' : '↘'})
   📊 Puntos Recientes: ${p.recent_scores} (Media: ${p.avg_recent_points.toFixed(1)})
   💎 Value Score: ${p.value_score.toFixed(1)}`
          )
          .join('\n\n');

        return { content: [{ type: 'text', text: `💰 OPORTUNIDADES DE MERCADO:\n\n${text}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'get_market_trends',
    'Analiza las tendencias de precios (subidas/bajadas significativas en 24h).',
    {
      min_change: z.number().optional().describe('Cambio mínimo de precio (default: 100,000)'),
    },
    async ({ min_change = 100000 }) => {
      try {
        const changes = await marketQueries.getSignificantPriceChanges(24, min_change);
        if (!changes.length)
          return { content: [{ type: 'text', text: 'Sin cambios significativos hoy.' }] };

        const text = changes
          .map(
            (p) =>
              `- ${p.name}: €${p.price.toLocaleString()} (${p.price_increment > 0 ? '🟢' : '🔴'} ${p.price_increment >= 0 ? '+' : ''}€${p.price_increment.toLocaleString()})`
          )
          .join('\n');

        return { content: [{ type: 'text', text: `📈 TENDENCIAS DE MERCADO (24h):\n\n${text}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
      }
    }
  );

  server.tool(
    'get_top_transfers',
    'Muestra los jugadores más fichados del mercado recientemente.',
    {},
    async () => {
      try {
        const tops = await marketQueries.getTopTransferredPlayer();
        if (!tops.length)
          return { content: [{ type: 'text', text: 'No hay datos de fichajes recientes.' }] };

        const text = tops
          .map(
            (t) =>
              `- **${t.name}**: ${t.transfer_count} fichajes (Precio medio: €${t.avg_price.toLocaleString()})`
          )
          .join('\n');

        return { content: [{ type: 'text', text: `🔥 JUGADORES MÁS FICHADOS:\n\n${text}` }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
      }
    }
  );
}
