import OpenAI from 'openai';
import { z } from 'zod';
import { auth } from '@/auth';
import {
  addAssistantMessage,
  findAssistantConversation,
  getAssistantModelContext,
} from '@/lib/services/features/assistantService';
import { errorResponse } from '@/lib/utils/response';
import { NextResponse } from 'next/server';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODELS = {
  groq: 'openai/gpt-oss-20b',
  openai: 'gpt-5.4-mini',
} as const;

const ASSISTANT_INSTRUCTIONS = `
You are the BiwengerStats assistant.

Your role is to help users understand EuroLeague fantasy basketball, Biwenger strategy, player trends, market decisions, lineup choices, and how to use the BiwengerStats app.

Style:
- Be concise, practical, and analytical.
- Prefer actionable recommendations over generic explanations.
- Use Spanish by default unless the user writes in another language.
- Be friendly but direct.
- Use Markdown when it makes the answer easier to scan.

Current limitations:
- You do not yet have live access to BiwengerStats data, user squads, market values, standings, player stats, or app actions.
- Do not invent specific player stats, prices, ownership data, standings, injury updates, or lineup data.
- If the user asks for data you cannot access, say that clearly and explain what data would be needed.
- You can still help with general fantasy strategy, decision frameworks, interpretation of stats provided by the user, and app usage guidance.
`.trim();

type AssistantProvider = keyof typeof DEFAULT_MODELS;

function getProvider(): AssistantProvider | null {
  const configuredProvider = process.env.AI_PROVIDER;

  if (configuredProvider === 'groq' || configuredProvider === 'openai') {
    return configuredProvider;
  }

  if (configuredProvider) {
    return null;
  }

  return process.env.GROQ_API_KEY ? 'groq' : 'openai';
}

function getProviderConfig(provider: AssistantProvider) {
  if (provider === 'groq') {
    return {
      apiKey: process.env.GROQ_API_KEY,
      baseURL: GROQ_BASE_URL,
      model: process.env.GROQ_MODEL || DEFAULT_MODELS.groq,
    };
  }

  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: undefined,
    model: process.env.OPENAI_MODEL || DEFAULT_MODELS.openai,
  };
}

const chatRequestSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    const parsedRequest = chatRequestSchema.safeParse(await request.json());

    if (!parsedRequest.success) {
      return errorResponse('El mensaje o la conversación no son válidos.', 400);
    }

    const conversation = await findAssistantConversation(
      session.user.id,
      parsedRequest.data.conversationId
    );

    if (!conversation) {
      return errorResponse('La conversación no existe o no pertenece al usuario.', 404);
    }

    const provider = getProvider();

    if (!provider) {
      return errorResponse('El proveedor de IA configurado no es válido.', 503);
    }

    const providerConfig = getProviderConfig(provider);

    if (!providerConfig.apiKey) {
      return errorResponse('El asistente no está configurado en el servidor.', 503);
    }

    const userMessage = await addAssistantMessage(
      conversation.id,
      'user',
      parsedRequest.data.message
    );
    const messages = await getAssistantModelContext(conversation.id);
    const client = new OpenAI({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseURL,
    });
    const response = await client.responses.create({
      model: providerConfig.model,
      instructions: ASSISTANT_INSTRUCTIONS,
      input: messages,
    });
    const message = response.output_text?.trim();

    if (!message) {
      return errorResponse('El asistente no ha devuelto una respuesta.', 502);
    }

    const assistantMessage = await addAssistantMessage(conversation.id, 'assistant', message);

    return NextResponse.json(
      { success: true, data: { conversationId: conversation.id, userMessage, assistantMessage } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[API Assistant] Error:', error);

    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      return errorResponse(
        'El proveedor de IA ha alcanzado su límite de uso o cuota disponible.',
        503
      );
    }

    return errorResponse('No se ha podido obtener una respuesta del asistente.', 500);
  }
}
