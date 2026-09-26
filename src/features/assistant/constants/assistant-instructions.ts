export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export const DEFAULT_MODELS = {
  groq: 'openai/gpt-oss-20b',
  openai: 'gpt-5.4-mini',
} as const;

export type AssistantProvider = keyof typeof DEFAULT_MODELS;

export const MODEL_CONTEXT_LIMIT = 20;
export const MAX_BLOCK_CHARS = 3000;
export const MAX_TOTAL_CONTEXT_CHARS = 12000;

export const STARTERS = [
  'Ayúdame a decidir entre dos jugadores para mi lineup.',
  '¿Cómo debería pensar una venta en el mercado?',
  'Explícame cómo analizar la regularidad de un jugador.',
] as const;

export const STOP_WORDS = new Set([
  'analiza',
  'analizar',
  'ayuda',
  'ayudame',
  'biwenger',
  'biwengerstats',
  'buscar',
  'compara',
  'comparar',
  'contra',
  'crees',
  'dame',
  'deberia',
  'debería',
  'del',
  'dime',
  'esta',
  'está',
  'fantasy',
  'jugador',
  'jugadores',
  'lineup',
  'mejor',
  'mercado',
  'opinas',
  'para',
  'precio',
  'puntos',
  'puedes',
  'quiero',
  'regularidad',
  'sobre',
  'stats',
  'tiene',
  'vender',
]);

export const ASSISTANT_INSTRUCTIONS = `
You are the BiwengerStats assistant.

Your role is to help users understand EuroLeague fantasy basketball, Biwenger strategy, player trends, market decisions, lineup choices, and how to use the BiwengerStats app.

Style:
- Be concise, practical, and analytical.
- Prefer actionable recommendations over generic explanations.
- Use Spanish by default unless the user writes in another language.
- Be friendly but direct.
- Use Markdown when it makes the answer easier to scan.

Current limitations:
- You only have live BiwengerStats data when a "BiwengerStats data context" block is provided in this request.
- If data context is provided, use it as the source of truth for that answer.
- The server may provide read-only context about players, the signed-in user's squad, standings, market activity, rounds, schedule, lineups, and manager comparisons.
- Do not invent specific player stats, prices, ownership data, standings, injury updates, or lineup data that are not present in the provided context.
- If the user asks for data you cannot access, say that clearly and explain what data would be needed.
- Do not claim you can buy, sell, bid, change lineups, or mutate Biwenger data. This phase is read-only.
- You can still help with general fantasy strategy, decision frameworks, interpretation of stats provided by the user, and app usage guidance.
`.trim();

export function buildInstructions(dataContext: string | null): string {
  if (!dataContext) return ASSISTANT_INSTRUCTIONS;

  return `${ASSISTANT_INSTRUCTIONS}

BiwengerStats data context:
${dataContext}

Use the data context above when it is relevant to the user's latest question. If the context does not answer the question, say what is missing instead of guessing.`;
}
