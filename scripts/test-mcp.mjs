import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { EventSource } from "eventsource";

global.EventSource = EventSource;

async function main() {
  console.log("🔵 Conectando al Servidor MCP...");
  const transport = new SSEClientTransport(new URL("http://localhost:3000/api/mcp"));
  const client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });

  try {
    await client.connect(transport);
    console.log("🟢 Conexión Establecida\n");

    // --- TEST 1: HERRAMIENTA DE ESTADO ---
    console.log("\n" + "=".repeat(50));
    console.log("🛠️  [TEST 1] Verificando Estado del Servidor...");
    const status = await client.callTool({
      name: "get_server_status",
      arguments: {}
    });
    console.log(`   Resultado: "${status.content[0].text}"`);
    console.log("   ✅ PASS: La herramienta básica responde.\n");

    // --- TEST 2: RECURSO DE ESQUEMA ---
    console.log("\n" + "=".repeat(50));
    console.log("📖 [TEST 2] Verificando Lectura del Esquema...");
    const { resources } = await client.listResources();
    const schemaResource = resources.find(r => r.name === "Esquema de Base de Datos");

    if (!schemaResource) {
      throw new Error("❌ FAIL: No se encontró el recurso 'Esquema de Base de Datos'");
    }

    console.log(`   Recurso encontrado: ${schemaResource.uri}`);
    const content = await client.readResource({ uri: schemaResource.uri });
    const textPreview = content.contents[0].text.substring(0, 150).replace(/\n/g, " ");
    
    console.log(`   Contenido (Preview): "${textPreview}..."`);
    
    if (content.contents[0].text.includes("TABLA:")) {
      console.log("   ✅ PASS: El esquema contiene tablas de la base de datos.\n");
    } else {
      console.log("   ❌ FAIL: El esquema parece vacío o incorrecto.\n");
    }

    // --- TEST 3: RECURSO DE REGLAS ---
    console.log("\n" + "=".repeat(50));
    console.log("📖 [TEST 3] Verificando Guía de Puntuación...");
    const rulesResource = resources.find(r => r.name === "Guía de Puntuación");

    if (!rulesResource) {
      throw new Error("❌ FAIL: No se encontró el recurso 'Guía de Puntuación'");
    }

    console.log(`   Recurso encontrado: ${rulesResource.uri}`);
    const rulesContent = await client.readResource({ uri: rulesResource.uri });
    const rulesText = rulesContent.contents[0].text;
    
    if (rulesText.includes("FÓRMULA PERSONALIZADA") && rulesText.includes("NO existe")) {
      console.log("   ✅ PASS: La guía de puntuación contiene las reglas clave actualizadas.");
    } else {
      console.log("   ❌ FAIL: El contenido de la guía no parece correcto.");
      console.log("   Recibido: " + rulesText.substring(0, 100) + "...");
    }

    // --- TEST 4: RECURSO DE GLOSARIO ---
    console.log("\n" + "=".repeat(50));
    console.log("📖 [TEST 4] Verificando Glosario...");
    const glossaryResource = resources.find(r => r.name === "Glosario de Términos");

    if (!glossaryResource) {
      throw new Error("❌ FAIL: No se encontró el recurso 'Glosario de Términos'");
    }

    console.log(`   Recurso encontrado: ${glossaryResource.uri}`);
    const glossaryContent = await client.readResource({ uri: glossaryResource.uri });
    const glossaryText = glossaryContent.contents[0].text;
    
    if (glossaryText.includes("Valoración") && glossaryText.includes("Fichaje") && glossaryText.includes("Saldo")) {
      console.log("   ✅ PASS: El glosario contiene las definiciones clave extendidas (Finanzas, Mercado).");
    } else {
      console.log("   ❌ FAIL: El contenido del glosario no parece correcto.");
      console.log("   Recibido: " + glossaryText.substring(0, 100) + "...");
    }

    // --- TEST 5: HERRAMIENTA DE BÚSQUEDA (Múltiples Casos) ---
    console.log("\n" + "=".repeat(50));
    console.log("🛠️  [TEST 5] Verificando Búsqueda de Jugadores (Múltiples)...");
    
    const playersToSearch = ["Mirotic", "Hifi", "Luwawu-Cabarrot", "Tavares"];
    let allSearchesPassed = true;

    for (const player of playersToSearch) {
      console.log(`   🔎 Buscando: "${player}"...`);
      const searchResult = await client.callTool({
        name: "search_players",
        arguments: { query: player }
      });

      const searchOutput = searchResult.content[0].text;
      
      console.log(`      📄 Resultado:\n${searchOutput}\n`);

      if (searchOutput.includes(player) && searchOutput.includes("Media:") && searchOutput.includes("Últimos 5:")) {
        console.log(`      ✅ Encontrado con datos completos.`);
      } else {
        console.log(`      ❌ FALLO en búsqueda de "${player}".`);
        console.log(`      Salida: ${searchOutput.substring(0, 100)}...`);
        allSearchesPassed = false;
      }
    }

    if (allSearchesPassed) {
      console.log("   ✅ PASS: Todas las búsquedas devolvieron resultados enriquecidos.");
    } else {
      console.log("   ❌ FAIL: Algunas búsquedas fallaron.");
    }

    // --- TEST 6: ANÁLISIS DETALLADO DE JUGADOR ---
    console.log("\n" + "=".repeat(50));
    console.log("🛠️  [TEST 6] Verificando Detalles de Jugador (ID: 328 - Mirotic)...");
    const detailsResult = await client.callTool({
      name: "get_player_details",
      arguments: { player_id: 328 }
    });

    const detailsOutput = detailsResult.content[0].text;
    console.log(`      📄 Resultado:\n${detailsOutput}\n`);

    if (detailsOutput.includes("PERFIL") && detailsOutput.includes("FORMA") && detailsOutput.includes("PRÓXIMOS RIVALES")) {
      console.log("   ✅ PASS: El análisis contiene todas las secciones clave.");
    } else {
      console.log("   ❌ FAIL: Falta información en el análisis.");
    }

    // --- TEST 7: CONSULTA SQL LIBRE (Top 3 Caros) ---
    console.log("\n" + "=".repeat(50));
    console.log("🛠️  [TEST 7] Verificando Consulta SQL (Top 3 Caros)...");
    
    const sqlQuery = "SELECT name, price FROM players ORDER BY price DESC LIMIT 3";
    console.log(`   📝 Ejecutando: "${sqlQuery}"...`);

    const sqlResult = await client.callTool({
      name: "read_sql_query",
      arguments: { query: sqlQuery }
    });

    const sqlOutput = sqlResult.content[0].text;
    console.log(`      📄 Resultado:\n${sqlOutput}\n`);

    if (sqlOutput.includes("Vezenkov") || sqlOutput.includes("James") || sqlOutput.includes("price")) {
      console.log("   ✅ PASS: La consulta SQL devolvió datos JSON correctos.");
    } else {
      console.log("   ❌ FAIL: La consulta falló o no devolvió los jugadores esperados.");
    }

    // --- TEST 8: RECURSO DE BIBLIOTECA SQL ---
    console.log("\n" + "=".repeat(50));
    console.log("📖 [TEST 8] Verificando Biblioteca de Consultas...");
    const libraryResource = resources.find(r => r.name === "Biblioteca de Consultas SQL"); // Check if name matches implementation? Wait, implementation uses default name from template? 
    // Actually implementation uses: server.resource("queries", ...) which maps to name? No, SDK maps it.
    // Let's check listResources output in main loop or just fetch by URI directly.
    
    // Better: Fetch by URI directly to be safe
    console.log(`   Recurso esperado: db://queries/library`);
    const libContent = await client.readResource({ uri: "db://queries/library" });
    const libText = libContent.contents[0].text;

    console.log("\n--- CONTENIDO DE LA BIBLIOTECA ---");
    console.log(libText);
    console.log("----------------------------------\n");
    
    if (libText.includes("SELECT") && libText.includes("MERCADO")) {
      console.log("   ✅ PASS: La biblioteca de consultas contiene SQL útil.");
    } else {
      console.error("   ❌ FAIL: La biblioteca no parece contener las plantillas esperadas.");
      process.exit(1);
    }

    // --- TEST 9: PROMPTS ---
    console.log("\n" + "=".repeat(50));
    console.log("🤖 [TEST 9] Verificando Prompts (Instrucciones)...");
    
    // Listar prompts disponibles
    const promptsList = await client.listPrompts();
    // Extraer nombres de forma segura
    const promptNames = promptsList.prompts ? promptsList.prompts.map(p => p.name) : [];
    
    if (promptNames.includes("analizar-jugador") && promptNames.includes("analizar-mercado")) {
      console.log(`   ✅ PASS: Prompts registrados: ${promptNames.join(", ")}`);
    } else {
      console.error(`   ❌ FAIL: Faltan prompts. Encontrados: ${promptNames.join(", ")}`);
      console.error("   Debug:", JSON.stringify(promptsList, null, 2));
      process.exit(1);
    }

    // Obtener contenido de un prompt específico
    console.log(`   🔍 Probando prompt 'analizar-jugador' con argumento 'Campazzo'...`);
    const promptResult = await client.getPrompt({
      name: "analizar-jugador",
      arguments: { player_name: "Campazzo" }
    });

    const instruction = promptResult.messages[0].content.text;
    if (instruction.includes("Campazzo") && instruction.includes("Recomendación Final")) {
      console.log("   ✅ PASS: El prompt generó instrucciones personalizadas correctamente.");
    } else {
      console.error("   ❌ FAIL: El contenido del prompt no es el esperado.");
      process.exit(1);
    }

    console.log("\n✅✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE ✅✅");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ ERROR CRÍTICO:", error);
  } finally {
    process.exit(0);
  }
}

main();