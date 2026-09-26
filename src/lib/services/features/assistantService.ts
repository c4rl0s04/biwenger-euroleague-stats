import {
  assistantRepository,
  getConversationTitle as featureGetConversationTitle,
  type AssistantRole,
  type AssistantConversation,
  type AssistantMessage,
} from '@/features/assistant/server';

export type { AssistantRole, AssistantConversation, AssistantMessage };

export function getConversationTitle(prompt: string): string {
  return featureGetConversationTitle(prompt);
}

export async function listAssistantConversations(userId: string): Promise<AssistantConversation[]> {
  return assistantRepository.listConversations(userId);
}

export async function createAssistantConversation(
  userId: string,
  firstPrompt: string
): Promise<AssistantConversation> {
  return assistantRepository.createConversation(userId, firstPrompt);
}

export async function findAssistantConversation(
  userId: string,
  conversationId: string
): Promise<AssistantConversation | null> {
  return assistantRepository.findConversation(userId, conversationId);
}

export async function getAssistantMessages(conversationId: string): Promise<AssistantMessage[]> {
  return assistantRepository.getMessages(conversationId);
}

export async function getAssistantModelContext(
  conversationId: string
): Promise<Array<{ role: AssistantRole; content: string }>> {
  return assistantRepository.getModelContext(conversationId);
}

export async function addAssistantMessage(
  conversationId: string,
  role: AssistantRole,
  content: string
): Promise<AssistantMessage> {
  return assistantRepository.addMessage(conversationId, role, content);
}

export async function deleteAssistantConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  return assistantRepository.deleteConversation(userId, conversationId);
}
