export type AssistantRole = 'user' | 'assistant';

export interface AssistantConversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  createdAt: Date;
}

export interface AssistantContextBlock {
  label: string;
  content: string;
}

export interface AssistantContextRequest {
  userId: string;
  message: string;
}

export interface AssistantDebugBlock {
  label: string;
  chars: number;
  content: string;
}

export interface AssistantDebugPayload {
  selectedProviders: string[];
  totalContextChars: number;
  blocks: AssistantDebugBlock[];
}

export interface AssistantChatResponse {
  conversationId: string;
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
  debug?: AssistantDebugPayload;
}

export interface AssistantConversationsResponse {
  conversations: AssistantConversation[];
}

export interface AssistantConversationDetailResponse {
  conversation: AssistantConversation;
  messages: AssistantMessage[];
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model: string;
}
