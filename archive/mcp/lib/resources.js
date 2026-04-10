import { db } from '@/lib/db/client';

/**
 * Registers all static resources to the MCP server.
 * Resources provide context (Rules, Glossary, Schema) to the AI.
 */
export function registerResources(server) {
  console.log('📦 Registrando Recursos (Contexto)...');

  // ---------------------------------------------------------
  // RECURSO 1: GUÍA DE PUNTUACIÓN (Contexto de Reglas)
  // ---------------------------------------------------------

  server.resource(
    'guia-puntuacion',
    'rules://scoring/guide',
    {
      name: 'Guía de Puntuación',
      description: 'Reglas oficiales de puntuación y mercado para Biwenger Euroleague.',
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: `GUÍA DE PUNTUACIÓN Y MERCADO (BIWENGER EUROLEAGUE)

1. SISTEMA DE PUNTUACIÓN (FÓRMULA PERSONALIZADA)
   - Puntuación basada en estadísticas reales, NO solo en valoración PIR.
   - Punto anotado: +1
   - Rebote: +1.2
   - Asistencia: +1.5
   - Robo: +2
   - Tapón: +2
   - Pérdida: -2
   - Tiro de 2 fallado: -0.3
   - Triple fallado: -0.5
   - Tiro Libre fallado: -0.5
   - El resultado total se redondea hacia arriba (Math.ceil).
   
   ⚠️ NO existe "Bonus por Victoria" extra para los jugadores.

2. MULTIPLICADORES DE ALINEACIÓN
   - Capitán: x2.0 (Puntúa doble)
   - Titular: x1.0
   - Sexto Hombre: x0.75 (Posición 6 en banquillo)
   - Banquillo: x0.5 (Resto de reservas)

3. ENTRENADOR (USUARIO)
   - Tu puntuación total es la suma de los puntos de tus jugadores multiplicados por su rol.
   - Puntuación Equipo = Σ (Puntos Jugador * Multiplicador Rol)

4. MERCADO
   - El valor flota diariamente según oferta y demanda.
   - Pujas ciegas hasta el cierre de mercado diario.`,
          },
        ],
      };
    }
  );

  server.resource(
    'glosario',
    'terms://glossary',
    {
      name: 'Glosario de Términos',
      description:
        'Diccionario de términos de negocio (Español) a esquema de base de datos (Inglés).',
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: `GLOSARIO DE TÉRMINOS Y MAPEO DE SCHEMA:

1. ENTIDADES
   - "Jugador" -> Tabla \`players\`
   - "Equipo" -> Tabla \`teams\` (unido por \`team_id\`)
   - "Usuario" / "Manager" -> Tabla \`users\`
   - "Partido" -> Tabla \`matches\`

2. ESTADÍSTICAS
   - "Valoración" (PIR) -> Columna \`valuation\`
   - "Puntos Fantasy" -> Columna \`fantasy_points\`
   - "Puntos Reales" (Anotados) -> Columna \`points\` (en tabla stats)
   - "Minutos" -> Columna \`minutes\`

3. POSICIONES (Columna \`position\`)
   - "Base" -> 'Base' (Guard)
   - "Alero" -> 'Alero' (Forward)
   - "Pivot" -> 'Pivot' (Center)

4. JUEGO Y ESTADO
   - "Jornada" -> Columna \`round_id\` (Ej: "Jornada 5" = 5)
   - "Capitán" -> Columna \`is_captain\` (boolean)
   - "Titular" -> Columna \`role\` = 'titular'
   - "Sexto Hombre" -> Columna \`role\` = '6th_man'
   - "Banquillo" -> Columna \`role\` = 'bench'
   - "Precio" / "Valor de Mercado" -> Columna \`price\`
   - "Estado" -> Columna \`status\` ('ok', 'injured', 'doubtful')

5. MERCADO Y FICHAJES
   - "Fichaje" -> Tabla \`fichajes\`
   - "Valor de Mercado" -> Tabla \`market_values\`
   - "Puja" -> Tabla \`transfer_bids\`
   - "Mercado" -> Actividad de compra/venta

6. FINANZAS
   - "Saldo" -> Calculado desde tabla \`finances\` (suma de \`amount\`)
   - "Movimiento" -> Columna \`type\` en \`finances\`
   - "Prima" -> Tipo de movimiento financiero (bonus)

7. COMPETICIÓN
   - "Liga" / "Torneo" -> Tabla \`tournaments\`
   - "Fase" -> Tabla \`tournament_phases\` (Regular Season, Playoffs)`,
          },
        ],
      };
    }
  );

  server.resource(
    'esquema-base-datos',
    'db://main/schema',
    {
      name: 'Esquema de Base de Datos',
      description: 'Mapa vivo de tablas y columnas para entender la estructura de datos.',
    },
    async (uri) => {
      try {
        // Consulta para obtener columnas y detectar claves foráneas
        const schemaQuery = `
          SELECT 
            table_name, column_name, data_type, 
            (SELECT COUNT(*) FROM information_schema.key_column_usage 
             WHERE table_name = c.table_name AND column_name = c.column_name) as is_key
          FROM information_schema.columns c
          WHERE table_schema = 'public'
          AND table_name NOT LIKE 'pg_%'
          ORDER BY table_name, ordinal_position;
        `;

        const result = await db.query(schemaQuery);

        const tables = result.rows.reduce((acc, row) => {
          if (!acc[row.table_name]) acc[row.table_name] = [];
          const keyDecorator = row.is_key > 0 ? '🔑 ' : '';
          acc[row.table_name].push(`${keyDecorator}${row.column_name} (${row.data_type})`);
          return acc;
        }, {});

        const schemaText = Object.entries(tables)
          .map(([table, cols]) => `TABLA: ${table}\n  - ${cols.join('\n  - ')}`)
          .join('\n\n');

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: 'text/plain',
              text: `ESQUEMA DE BASE DE DATOS (EN VIVO):\n\n${schemaText}`,
            },
          ],
        };
      } catch (error) {
        return { contents: [{ uri: uri.href, text: `Error de Esquema: ${error.message}` }] };
      }
    }
  );
}
