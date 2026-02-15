import { z } from 'zod';

/**
 * Registers prompts (instruction templates) to the MCP server.
 * Prompts guide the AI on how to perform complex tasks using available tools and resources.
 * @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server
 */
export function registerPrompts(server) {
  // ---------------------------------------------------------
  // PROMPT 1: ANALIZAR JUGADOR (Player Analysis Strategy)
  // ---------------------------------------------------------
  server.prompt(
    'analizar-jugador',
    { player_name: z.string().describe('Nombre del jugador') },
    ({ player_name }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Por favor, analiza al jugador "${player_name}" para tomar una decisión de fichaje o alineación en Biwenger Euroleague.

Sigue estos pasos estrictamente:
1. BUSCAR ID: Usa la herramienta 'search_players' para encontrar el ID correcto de "${player_name}".
2. OBTENER DETALLES: Usa 'get_player_details' con ese ID para obtener sus estadísticas, forma reciente y calendario.
3. CONSULTAR REGLAS: Lee el recurso 'rules://scoring/guide' para entender cómo su posición y acciones impactan en la puntuación (ej: valoración vs puntos reales).
4. GENERAR INFORME:
   - Resumen del perfil (Equipo, Precio, Estado).
   - Análisis de Forma (¿Está en racha? ¿Es irregular?).
   - Análisis de Calendario (¿Tiene partidos difíciles próximos?).
   - Recomendación Final: ¿FICHAR, MANTENER o VENDER? Justifica basándote en datos.`,
          },
        },
      ],
    })
  );

  // ---------------------------------------------------------
  // PROMPT 2: ANALIZAR MERCADO (Market Opportunities Strategy)
  // ---------------------------------------------------------
  server.prompt('analizar-mercado', {}, () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Analiza el mercado actual para encontrar oportunidades de fichaje o venta.

Sigue estos pasos:
1. LEER BIBLIOTECA SQL: Lee el recurso 'db://queries/library' para ver qué consultas de mercado están disponibles.
2. EJECUTAR CONSULTAS:
   - Ejecuta la consulta de "Top 5 Subidas de Precio" (usando 'read_sql_query').
   - Ejecuta la consulta de "Top 5 Bajadas de Precio".
3. ANALIZAR RESULTADOS:
   - Para las subidas: ¿ Son jugadores que han explotado recientemente? (Cruza con 'get_player_details' si es necesario).
   - Para las bajadas: ¿Son oportunidades de compra por una mala racha temporal o lesiones?
4. CONCLUSIÓN: Lista 3 recomendaciones claras de compra y 3 de venta.`,
        },
      },
    ],
  }));
}
