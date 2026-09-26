import OpenAI from 'openai';
import {
  DEFAULT_MODELS,
  GROQ_BASE_URL,
  type AssistantProvider,
  buildInstructions,
} from '../../constants/assistant-instructions';
import type { ProviderConfig } from '../../models/assistant.models';

export class AssistantProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'AssistantProviderError';
  }
}

export class AssistantProviderService {
  getProvider(): AssistantProvider | null {
    const configuredProvider = process.env.AI_PROVIDER;

    if (configuredProvider === 'groq' || configuredProvider === 'openai') {
      return configuredProvider;
    }

    if (configuredProvider) {
      return null;
    }

    return process.env.GROQ_API_KEY ? 'groq' : 'openai';
  }

  getProviderConfig(provider: AssistantProvider): ProviderConfig {
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

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    dataContext: string | null
  ): Promise<string> {
    const provider = this.getProvider();

    if (!provider) {
      throw new AssistantProviderError('El proveedor de IA configurado no es válido.', 503);
    }

    const providerConfig = this.getProviderConfig(provider);

    if (!providerConfig.apiKey) {
      throw new AssistantProviderError('El asistente no está configurado en el servidor.', 503);
    }

    try {
      const client = new OpenAI({
        apiKey: providerConfig.apiKey,
        baseURL: providerConfig.baseURL,
      });

      const response = await client.responses.create({
        model: providerConfig.model,
        instructions: buildInstructions(dataContext),
        input: messages,
      });

      const output = response.output_text?.trim();

      if (!output) {
        throw new AssistantProviderError('El asistente no ha devuelto una respuesta.', 502);
      }

      return output;
    } catch (error) {
      if (error instanceof AssistantProviderError) {
        throw error;
      }

      if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
        throw new AssistantProviderError(
          'El proveedor de IA ha alcanzado su límite de uso o cuota disponible.',
          503,
          error
        );
      }

      console.error('[Assistant Provider] Error calling AI model:', error);
      throw new AssistantProviderError(
        'No se ha podido obtener una respuesta del asistente.',
        500,
        error
      );
    }
  }
}

export const assistantProviderService = new AssistantProviderService();
