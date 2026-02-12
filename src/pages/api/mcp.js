import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { db } from '@/lib/db/client';

const server = new McpServer({
  name: 'BiwengerStats',
  version: '1.0.0',
});

// ---------------------------------------------------------
// � RESOURCES: The AI's Knowledge Base
// ---------------------------------------------------------
server.resource('db-schema', 'resource://database/schema', async (uri) => ({
  contents: [
    {
      uri: uri.href,
      text: `
        DATABASE SCHEMA (Spanish Naming):
        - players: id (int), name (text), position (text), team_id (int), puntos (int), price (int), status (text)
        - teams: id (int), name (text), abbreviation (text)
        - matches: id (int), home_team_id (int), away_team_id (int), date (timestamp)
        Note: Use 'puntos' for scoring/points.
      `,
    },
  ],
}));

// ---------------------------------------------------------
// �️ TOOLS: Actions
// ---------------------------------------------------------

server.tool('get_server_status', 'Check connection health.', {}, async () => ({
  content: [{ type: 'text', text: '✅ Online' }],
}));

server.tool(
  'read_sql_query',
  'Execute read-only SQL. Refer to resource://database/schema for column names.',
  { query: z.string() },
  async ({ query }) => {
    try {
      const forbidden = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'TRUNCATE'];
      if (forbidden.some((cmd) => query.toUpperCase().includes(cmd))) {
        return { isError: true, content: [{ type: 'text', text: '❌ Security Error' }] };
      }
      const result = await db.query(query);
      return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
    } catch (e) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

server.tool(
  'get_player_details',
  'Get rich player data using project logic.',
  { playerId: z.number() },
  async ({ playerId }) => {
    try {
      // DYNAMIC REQUIRE to bypass Next.js static export checks
      const playerQueries = require('@/lib/db/queries/core/players');
      const getFunc = playerQueries.getPlayerDetails || playerQueries.getPlayer;

      const player = await getFunc(playerId);
      return { content: [{ type: 'text', text: JSON.stringify(player || 'Not found') }] };
    } catch (e) {
      return { isError: true, content: [{ type: 'text', text: e.message }] };
    }
  }
);

// ---------------------------------------------------------
// � PROMPTS: Reusable Instructions
// ---------------------------------------------------------
server.prompt('analyze-player', { playerName: z.string() }, ({ playerName }) => ({
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        text: `Search for ${playerName} in the database, get their ID, and then provide a performance summary using get_player_details.`,
      },
    },
  ],
}));

// ---------------------------------------------------------
// � TRANSPORT & CONFIG
// ---------------------------------------------------------
let transport;
export default async function handler(req, res) {
  if (req.method === 'GET') {
    transport = new SSEServerTransport('/api/mcp', res);
    await server.connect(transport);
    return;
  }
  if (req.method === 'POST') {
    if (!transport) return res.status(400).json({ error: 'No connection' });
    await transport.handlePostMessage(req, res);
    return;
  }
}

export const config = { api: { bodyParser: false } };
