import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerResources } from '@/lib/mcp/resources';
import { registerTools } from '@/lib/mcp/tools';
import { registerPrompts } from '@/lib/mcp/prompts';

// Inicializar Servidor MCP
const server = new McpServer({
  name: 'BiwengerStats',
  version: '1.0.0',
});

// Registrar Recursos, Herramientas y Prompts (Modules)
registerResources(server);
registerTools(server);
registerPrompts(server);

// Configuración de transporte SSE (Server-Sent Events)
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
