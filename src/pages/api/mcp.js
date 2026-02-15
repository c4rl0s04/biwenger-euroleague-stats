import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerResources } from '@/lib/mcp/resources';
import { registerTools } from '@/lib/mcp/tools';
import { registerPrompts } from '@/lib/mcp/prompts';

// Initialize MCP Server
// Capabilities:
// - resources: Context (Rules, Schema)
// - tools: Actions (DB Queries, Logic)
// - prompts: Instructions (Standard Operating Procedures)
const server = new McpServer({
  name: 'Biwenger Euroleague MCP',
  version: '2.0.0',
});

// Register Modules
registerResources(server);
registerTools(server);
registerPrompts(server);

// API Handler (SSE Transport)
let transport;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    transport = new SSEServerTransport('/api/mcp', res);
    await server.connect(transport);
    return;
  }
  if (req.method === 'POST') {
    if (!transport) return res.status(400).json({ error: 'Sin conexión activa' });
    await transport.handlePostMessage(req, res);
    return;
  }
  res.status(405).json({ error: 'Método no permitido' });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
