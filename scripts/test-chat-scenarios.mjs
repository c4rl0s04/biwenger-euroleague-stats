

const BASE_URL = "http://localhost:3000/api/chat";

async function runTest(name, messages) {
  console.log(`\n🧪 TEST: ${name}`);
  console.log(`   User: "${messages[messages.length - 1].content}"`);
  console.log("   Waiting for response...");

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const reader = response.body;
    const decoder = new TextDecoder();
    let fullText = "";

    for await (const chunk of reader) {
      const text = decoder.decode(chunk);
      process.stdout.write(text);
      fullText += text;
    }
    console.log("\n   ✅ Done.");
    return fullText;

  } catch (error) {
    console.error(`   ❌ FAILED: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("🚀 Starting Comprehensive AI Agent Tests...\n");

  // 1. Basic Chat
  await runTest("Basic Chat", [
    { role: "user", content: "Hello, are you ready to help me?" }
  ]);

  // 2. Player Search (Tool: search_players)
  // We ask for a specific player to see if it finds the ID
  await runTest("Search Player", [
    { role: "user", content: "Search for the player 'Campazzo' and tell me his team." }
  ]);

  // 3. Market Analysis (Tool: get_market_opportunities)
  await runTest("Market Analysis", [
    { role: "user", content: "Who are the top 3 market opportunities (chollos) right now based on value?" }
  ]);

  // 4. Player Details (Tool: get_player_details)
  // Identifying a specific player ID would be ideal, but we can ask by name and hope the agent chains search + details
  await runTest("Player Deep Dive", [
    { role: "user", content: "Give me a detailed analysis of Markus Howard's recent performance." }
  ]);

  console.log("\n✨ All tests completed.");
}

main();
