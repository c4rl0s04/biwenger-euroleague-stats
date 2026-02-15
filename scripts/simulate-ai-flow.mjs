
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { EventSource } from "eventsource";

// Polyfill para EventSource en Node.js
global.EventSource = EventSource;

async function simulateAgent() {
  console.log("🤖 INICIANDO SIMULACIÓN DE AGENTE IA...");
  
  const transport = new SSEClientTransport(new URL("http://localhost:3000/api/mcp"));
  const client = new Client({ name: "SimulatedAgent", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("✅ Conectado al Servidor MCP.");

    // =================================================================
    // ESCENARIO 1: ANÁLISIS DE JUGADOR
    // Usuario: "¿Me recomiendas fichar a Campazzo?"
    // =================================================================
    console.log("\n🎬 ESCENARIO 1: ANÁLISIS DE JUGADOR ('Campazzo')");
    
    // 1. Agente pide el Prompt
    console.log("🧠 Agente: Solicitando instrucciones 'analizar-jugador'...");
    const promptResult = await client.getPrompt({
      name: "analizar-jugador",
      arguments: { player_name: "Campazzo" }
    });
    const instructions = promptResult.messages[0].content.text;
    console.log("📄 Instrucciones Recibidas:\n", instructions.split("\n").slice(0, 3).join("\n") + "...");

    // 2. Agente sigue paso 1: BUSCAR ID
    console.log("\n🛠️ Agente: Ejecutando tool 'search_players'...");
    const searchResult = await client.callTool({
      name: "search_players",
      arguments: { query: "Campazzo" }
    });
    const searchOutput = searchResult.content[0].text;
    console.log("📄 Resultado Búsqueda (Extracto):", searchOutput.split("\n")[2]); // Mostrar primera línea de resultado
    
    // Simular que el Agente "lee" el ID del texto (Regex simple para la demo)
    const idMatch = searchOutput.match(/ID: (\d+)/);
    const playerId = idMatch ? parseInt(idMatch[1]) : null;

    if (playerId) {
      console.log(`🤖 Agente: He detectado el ID ${playerId}. Procediendo al paso 2.`);
      
      // 3. Agente sigue paso 2: OBTENER DETALLES
      console.log(`\n🛠️ Agente: Ejecutando tool 'get_player_details' con ID ${playerId}...`);
      const detailsResult = await client.callTool({
        name: "get_player_details",
        arguments: { player_id: playerId }
      });
      const detailsOutput = detailsResult.content[0].text;
      
      console.log("📄 Detalles Recibidos:");
      console.log(detailsOutput.split("\n").slice(0, 6).join("\n")); // Mostrar header y perfil
      console.log("... [resto del análisis omitido] ...");
    } else {
        console.error("❌ Agente: No pude encontrar el ID. Abortando escenario.");
    }

    // =================================================================
    // ESCENARIO 2: OPORTUNIDADES DE MERCADO
    // Usuario: "¿Qué oportunidades hay en el mercado?"
    // =================================================================
    console.log("\n\n🎬 ESCENARIO 2: OPORTUNIDADES DE MERCADO");

    // 1. Agente pide el Prompt
    console.log("🧠 Agente: Solicitando instrucciones 'analizar-mercado'...");
    const marketPrompt = await client.getPrompt({ 
      name: "analizar-mercado",
      arguments: {} 
    });
    console.log("📄 Instrucciones Recibidas. Paso 1: Leer biblioteca.");

    // 2. Agente lee la biblioteca (simulado, ya que el prompt lo dice)
    // En una app real, el LLM leería el recurso. Aquí saltamos directo a la acción sugerida.

    // 3. Agente ejecuta consulta de "Top Subidas"
    console.log("\n🛠️ Agente: Ejecutando consulta SQL 'Top 5 Subidas' (Tool: read_sql_query)...");
    
    // SQL extraído "mentalmente" de la biblioteca por el agente
    const sqlQuery = `SELECT p.name, p.price, (p.price - (SELECT price FROM market_values WHERE player_id = p.id ORDER BY date ASC LIMIT 1)) as increase FROM players p WHERE p.status = 'ok' ORDER BY increase DESC LIMIT 3;`;
    
    const queryResult = await client.callTool({
      name: "read_sql_query",
      arguments: { query: sqlQuery }
    });
    
    console.log("📄 Datos de Mercado:");
    console.log(queryResult.content[0].text);

    console.log("\n✅✅ SIMULACIÓN COMPLETADA CON ÉXITO ✅✅");

  } catch (error) {
    console.error("\n❌ ERROR EN SIMULACIÓN:", error);
  } finally {
    process.exit(0);
  }
}

simulateAgent();
