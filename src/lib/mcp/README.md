# Biwenger Euroleague MCP Server

This directory contains the logic for the **Model Context Protocol (MCP)** server, which powers the AI Agents for this application.

## 📂 Structure

### 1. `resources.js` (Context)

**"What the AI knows."**
Static read-only data that provides context to the LLM.

- `rules://scoring/guide`: Official scoring rules.
- `terms://glossary`: Business terms mapping.
- `db://main/schema`: Live database schema using `information_schema`.

### 2. `tools.js` (Actions)

**"What the AI can do."**
Executable functions that perform logic or fetch dynamic data.

- `search_players`: Fuzzy search for player IDs.
- `get_player_details`: Deep dive analysis (stats, market, schedule).
- `get_market_opportunities`: **(Business Logic)** Wraps `marketQueries.getMarketOpportunities` to find high-value players.
- `get_market_trends`: **(Business Logic)** Analysis of price risers/fallers.

### 3. `prompts.js` (Instructions)

**"How the AI should behave."**
Standard Operating Procedures (SOPs) that guide the AI to use tools/resources correctly.

- `analizar-jugador`: Guides a full player analysis workflow.
- `analizar-mercado`: Guides a market opportunity scanning workflow.

## 🚀 Usage

The entry point is at `src/pages/api/mcp.js`.
To test the server, use the scripts provided in the root directory:

```bash
# Unit Tests (Components)
node scripts/test-mcp.mjs

# End-to-End Simulation (Agent Workflow)
node scripts/simulate-ai-flow.mjs
```
