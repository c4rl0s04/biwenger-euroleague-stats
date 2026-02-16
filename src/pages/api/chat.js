// Polyfill EventSource for Node.js
import { EventSource } from 'eventsource';
global.EventSource = global.EventSource || EventSource;

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// Initialize Provider
console.log('[Agent] GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || 'dummy',
  compatibility: 'compatible', // Better for non-OpenAI providers
});

// Helper: Map JSON Schema to Zod
function jsonSchemaToZod(schema) {
  if (!schema || !schema.properties) return z.object({});

  const shape = {};
  for (const [key, value] of Object.entries(schema.properties)) {
    if (value.type === 'string') shape[key] = z.string().describe(value.description || '');
    else if (value.type === 'number' || value.type === 'integer')
      shape[key] = z.number().describe(value.description || '');
    else if (value.type === 'boolean') shape[key] = z.boolean().describe(value.description || '');
    // Add more types if needed
  }
  return z.object(shape);
}

// Helper: Connect to local MCP Server
async function getMcpTools() {
  const transport = new SSEClientTransport(new URL('http://localhost:3000/api/mcp'));

  const client = new Client(
    { name: 'BiwengerAgent', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  await client.connect(transport);

  // Fetch available tools from MCP
  const mcpToolsList = await client.listTools();

  // Convert MCP Tools to Vercel AI SDK Tools format
  const aiTools = {};

  for (const t of mcpToolsList.tools) {
    console.log(`[Agent] Registering Tool: ${t.name}`, JSON.stringify(t.inputSchema));

    // Improved Zod Converter
    const zodSchema = (() => {
      if (!t.inputSchema || !t.inputSchema.properties) return z.object({});
      const shape = {};
      const required = t.inputSchema.required || [];

      for (const [key, value] of Object.entries(t.inputSchema.properties)) {
        let zType;
        if (value.type === 'string') zType = z.string().describe(value.description || '');
        else if (value.type === 'number' || value.type === 'integer')
          zType = z.number().describe(value.description || '');
        else if (value.type === 'boolean') zType = z.boolean().describe(value.description || '');
        else zType = z.any().describe(value.description || ''); // Fallback

        if (!required.includes(key)) zType = zType.optional();
        shape[key] = zType;
      }
      return z.object(shape);
    })();

    aiTools[t.name] = tool({
      description: t.description,
      parameters: zodSchema,
      execute: async (args) => {
        console.log(`[Agent] Calling MCP Tool: ${t.name}`, JSON.stringify(args));
        const result = await client.callTool({
          name: t.name,
          arguments: args,
        });
        // MCP returns { content: [{ type: 'text', text: '...' }] }
        // AI SDK expects a string or simple object
        const textContent = result.content.find((c) => c.type === 'text')?.text;
        return textContent || JSON.stringify(result.content);
      },
    });
  }

  return { aiTools, client };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = await req.body;
  console.log('[Agent] Using Groq Model: llama-3.3-70b-versatile');

  try {
    // 1. Connect to MCP to get tools
    console.log('[Agent] Connecting to MCP Server...');
    const { aiTools } = await getMcpTools();

    // Manual Recursive Loop
    let currentMessages = [...messages];
    const MAX_STEPS = 5;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    for (let step = 0; step < MAX_STEPS; step++) {
      console.log(`[Agent] Step ${step + 1}/${MAX_STEPS}`);

      const result = await streamText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a Basket Biwenger Expert AI. 
            You have access to a database of players, market stats, and rules via tools.
            
            RULES:
            - ALWAYS check the database before guessing.
            - If asked about a player, use 'search_players' first to get their ID.
            - Then use 'get_player_details' to see stats.
            - For market questions, use 'get_market_opportunities'.
            - Be concise and helpful. formatting with Markdown.

            IMPORTANT: When calling tools, YOU MUST PROVIDE ARGUMENTS. 
            Example: search_players({ query: "Campazzo" }) NOT search_players({}).
            Do not call tools with empty arguments if they require inputs.`,
        messages: currentMessages,
        tools: aiTools,
        maxSteps: 1, // We handle recursion manually
      });

      const stream = result.fullStream;
      if (!stream) throw new Error('No stream found');

      let toolCalls = [];
      let textGenerated = false;

      for await (const part of stream) {
        if (part.type === 'text-delta') {
          if (part.text) {
            res.write(part.text);
            textGenerated = true;
          }
        } else if (part.type === 'tool-call') {
          console.log(`[Agent] Tool Call Detected: ${part.toolName}`);
          // console.log("[Agent] Tool Call Part:", JSON.stringify(part, null, 2)); // Debug
          toolCalls.push(part);
        } else if (part.type === 'error') {
          console.error('[Agent] Stream Error:', part.error);
        }
      }

      // If no tool calls, we are done
      if (toolCalls.length === 0) {
        console.log('[Agent] No tool calls, finishing.');
        break;
      }

      // Execute Tools
      const toolResults = await Promise.all(
        toolCalls.map(async (tc) => {
          console.log(`[Agent] Executing ${tc.toolName}...`);
          const toolArgs = tc.args ?? tc.input; // Handle both possibilities

          try {
            const result = await aiTools[tc.toolName].execute(toolArgs);
            // Construct valid ToolResultPart per AI SDK v6
            return {
              type: 'tool-result',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              output: {
                type: 'json', // or 'text' if result is string
                value: result,
              },
            };
          } catch (err) {
            console.error(`[Agent] Tool Execution Error (${tc.toolName}):`, err);
            return {
              type: 'tool-result',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              output: {
                type: 'error-json', // or error-text
                value: { error: err.message },
              },
            };
          }
        })
      );

      // Append to history for next turn
      currentMessages.push({
        role: 'assistant',
        content: toolCalls.map((tc) => ({
          type: 'tool-call',
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          input: tc.args ?? tc.input,
        })),
      });

      // 2. Tool results
      currentMessages.push({
        role: 'tool',
        content: toolResults,
      });
    }

    res.end();
  } catch (error) {
    console.error('[Agent] Error:', error);
    // Handle API Key error gracefully
    if (
      error.message.includes('API key is missing') ||
      error.message.includes('Invalid API Key') ||
      (error.cause && error.cause.message && error.cause.message.includes('Invalid API Key'))
    ) {
      // If headers sent, we can't send json.
      if (!res.headersSent)
        return res
          .status(500)
          .json({ error: 'Configuration Error: GROQ_API_KEY is missing or invalid.' });
    }
    if (!res.headersSent) res.status(500).json({ error: error.message });
    else res.end(); // Ensure stream ends on error
  }
}
