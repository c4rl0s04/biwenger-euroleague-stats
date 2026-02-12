import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { EventSource } from "eventsource";

global.EventSource = EventSource;

async function main() {
  const transport = new SSEClientTransport(new URL("http://localhost:3000/api/mcp"));
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("� Connected to MCP Server\n");

    // --- TEST 1: DISCOVER RESOURCES (Schema) ---
    console.log("� Testing Resources (Schema Discovery)...");
    const resources = await client.listResources();
    if (resources.resources.length > 0) {
      const schema = await client.readResource({ uri: "resource://database/schema" });
      console.log("✅ Schema Resource Found:\n", schema.contents[0].text.trim().substring(0, 150) + "...");
    }

    // --- TEST 2: DISCOVER PROMPTS ---
    console.log("\n� Testing Prompts...");
    const prompts = await client.listPrompts();
    prompts.prompts.forEach(p => console.log(`✅ Found Prompt: [${p.name}] - ${p.description}`));

    // --- TEST 3: TEST UPDATED TOOL DESCRIPTIONS ---
    console.log("\n�️ Testing Tool Descriptions...");
    const { tools } = await client.listTools();
    tools.forEach(t => {
      if (t.description) console.log(`✅ Tool: [${t.name}] has a valid description.`);
      else console.log(`❌ Tool: [${t.name}] is missing a description!`);
    });

  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    process.exit(0);
  }
}

main();