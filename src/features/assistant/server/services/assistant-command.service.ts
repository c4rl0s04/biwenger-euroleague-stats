import 'server-only';

import {
  ChatRequestSchema,
  CreateConversationSchema,
  ConversationIdParamSchema,
  AssistantValidationError,
  type ChatRequestInput,
  type CreateConversationInput,
} from '../../validation/assistant.schema';
import type {
  AssistantChatResponse,
  AssistantConversation,
  AssistantDebugPayload,
} from '../../models/assistant.models';
import { assistantRepository, AssistantRepository } from '../repositories/assistant.repository';
import {
  assistantProviderService,
  AssistantProviderService,
  AssistantProviderError,
} from './assistant-provider.service';
import {
  buildAssistantContext,
  formatAssistantContextBlocks,
  getAssistantContextProviderNamesForMessage,
} from './assistant-context.service';

export class AssistantConversationNotFoundError extends Error {
  constructor(message = 'La conversación no existe o no pertenece al usuario.') {
    super(message);
    this.name = 'AssistantConversationNotFoundError';
  }
}

function buildDebugPayload(
  message: string,
  contextBlocks: { label: string; content: string }[]
): AssistantDebugPayload | undefined {
  if (process.env.NODE_ENV !== 'development') return undefined;

  return {
    selectedProviders: getAssistantContextProviderNamesForMessage(message),
    totalContextChars: contextBlocks.reduce((sum, block) => sum + block.content.length, 0),
    blocks: contextBlocks.map((block) => ({
      label: block.label,
      chars: block.content.length,
      content: block.content,
    })),
  };
}

export class AssistantCommandService {
  constructor(
    private readonly repo: AssistantRepository = assistantRepository,
    private readonly provider: AssistantProviderService = assistantProviderService
  ) {}

  async createConversation(userId: string, rawInput: unknown): Promise<AssistantConversation> {
    const parsed = CreateConversationSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AssistantValidationError(
        'No se ha podido crear la conversación con ese mensaje.',
        parsed.error.issues
      );
    }

    return this.repo.createConversation(userId, parsed.data.firstPrompt);
  }

  async deleteConversation(userId: string, rawConversationId: string): Promise<boolean> {
    const parsedId = ConversationIdParamSchema.safeParse(rawConversationId);
    if (!parsedId.success) {
      throw new AssistantValidationError('El identificador no es válido.', parsedId.error.issues);
    }

    const conversation = await this.repo.findConversation(userId, parsedId.data);
    if (!conversation) {
      throw new AssistantConversationNotFoundError();
    }

    return this.repo.deleteConversation(userId, conversation.id);
  }

  async sendMessage(userId: string, rawInput: unknown): Promise<AssistantChatResponse> {
    const parsed = ChatRequestSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new AssistantValidationError(
        'El mensaje o la conversación no son válidos.',
        parsed.error.issues
      );
    }

    const { conversationId, message } = parsed.data;

    const conversation = await this.repo.findConversation(userId, conversationId);
    if (!conversation) {
      throw new AssistantConversationNotFoundError();
    }

    const userMessage = await this.repo.addMessage(conversation.id, 'user', message);

    let dataContext: string | null = null;
    let debugPayload: AssistantDebugPayload | undefined;

    try {
      const contextBlocks = await buildAssistantContext({
        userId,
        message,
      });
      dataContext = formatAssistantContextBlocks(contextBlocks);
      debugPayload = buildDebugPayload(message, contextBlocks);
    } catch (contextError) {
      console.error('[Assistant Command] Context generation error:', contextError);
    }

    const modelMessages = await this.repo.getModelContext(conversation.id);
    const replyText = await this.provider.generateResponse(modelMessages, dataContext);

    const assistantMessage = await this.repo.addMessage(conversation.id, 'assistant', replyText);

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      ...(debugPayload ? { debug: debugPayload } : {}),
    };
  }
}

export const assistantCommandService = new AssistantCommandService();
