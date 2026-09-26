import {
  ConversationIdParamSchema,
  AssistantValidationError,
} from '../../validation/assistant.schema';
import type {
  AssistantConversation,
  AssistantConversationDetailResponse,
  AssistantConversationsResponse,
} from '../../models/assistant.models';
import { assistantRepository, AssistantRepository } from '../repositories/assistant.repository';

export class AssistantReadService {
  constructor(private readonly repo: AssistantRepository = assistantRepository) {}

  async listConversations(userId: string): Promise<AssistantConversationsResponse> {
    const conversations = await this.repo.listConversations(userId);
    return { conversations };
  }

  async getConversation(
    userId: string,
    rawConversationId: string
  ): Promise<AssistantConversationDetailResponse | null> {
    const parsedId = ConversationIdParamSchema.safeParse(rawConversationId);
    if (!parsedId.success) {
      throw new AssistantValidationError(
        'El identificador de conversación no es válido.',
        parsedId.error.issues
      );
    }

    const conversation = await this.repo.findConversation(userId, parsedId.data);
    if (!conversation) {
      return null;
    }

    const messages = await this.repo.getMessages(conversation.id);

    return {
      conversation,
      messages,
    };
  }
}

export const assistantReadService = new AssistantReadService();
