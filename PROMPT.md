# Role
Act as a Senior AI Engineer and Full Stack Developer expert in Next.js, LangChain, and LangGraph.

# Project Context
We are upgrading a fantasy basketball stats application ("Biwenger Stats"). 
Current Stack: Next.js 15 (App Router), PostgreSQL (pg), Vercel AI SDK (UI).

# The Goal
We need to replace the current simple chatbot endpoint (`src/app/api/chat/route.js`) with a robust **Multi-Agent System** using **LangGraph.js**.

# Architecture & Tech Stack
You must strictly adhere to this architecture:
1. **Orchestration:** `langgraph` (Stateful, looping logic for agents).
2. **LLM Interface:** `@langchain/google-genai` (Using Gemini 1.5 Flash/Pro).
3. **Vector DB:** `pgvector` (Postgres extension) to store documentation embeddings.
4. **SQL Toolkit:** `LangChain SQLDatabase` for text-to-SQL capabilities.
5. **Frontend Connection:** `LangChainAdapter` (from 'ai' package) to stream LangGraph events to the existing Vercel AI SDK frontend.

# Required Agents / Nodes
The graph should utilize a "Supervisor/Router" pattern or a specialized State Graph with the following capabilities:

1.  **The Analyst (SQL Agent):**
    * **Tool:** `sql_db_query`.
    * **Capability:** Inspects the database schema (tables: players, matches, stats, standings) and executes SQL queries to answer statistical questions.
    * **Constraint:** Read-only access. Must handle SQL errors gracefully and retry.

2.  **The Librarian (RAG Agent):**
    * **Tool:** `search_documentation`.
    * **Capability:** Queries a `documents` table in Postgres using vector similarity search to answer questions about rules, logic, or calculations.
    * **Source Material:** All markdown files in the `docs/` folder.

# Implementation Plan
Please guide me through the implementation in the following order. Do not generate all code at once; let's go step-by-step.

## Step 1: Dependencies & Environment
* List the `npm install` commands for: langchain, langgraph, @langchain/google-genai, @langchain/community, pgvector, and any adapters.
* Explain any necessary SQL commands to enable the `vector` extension in Postgres.

## Step 2: RAG Infrastructure ("The Librarian")
* Create a script `scripts/ingest-docs.js` to read all `.md` files from `docs/`, split them, generate embeddings (using Google Text Embeddings), and store them in a new `documents` table.
* Create the `search_documentation` tool in `src/lib/ai/tools/librarian.js`.

## Step 3: SQL Infrastructure ("The Analyst")
* Create the SQL connection logic in `src/lib/ai/tools/analyst.js`.
* Use `SqlDatabase` from LangChain to inspect the schema defined in `src/lib/db/schema.js`.
* Setup the tool that allows the LLM to query the DB.

## Step 4: The Brain (LangGraph)
* Create `src/lib/ai/graph.js`.
* Define the `AgentState`.
* Implement the nodes: `agent` (router) and `tools` (executor).
* Set up the conditional edges (if tool call -> tools node; if final answer -> end).

## Step 5: Integration
* Rewrite `src/app/api/chat/route.js` to initialize the Graph and stream the response using `LangChainAdapter.toDataStreamResponse`.

# Existing File References
* DB Client: `src/lib/db/client.js`
* DB Schema: `src/lib/db/schema.js`
* Docs: `docs/*.md`

Let's start with **Step 1: Dependencies & Environment**.