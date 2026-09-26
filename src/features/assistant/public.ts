export { default as DesktopAssistantScreen } from './screens/DesktopAssistantScreen';
export { default as MobileAssistantScreen } from './screens/MobileAssistantScreen';
export { default as AssistantChat } from './components/AssistantChat';

export type {
  AssistantRole,
  AssistantConversation,
  AssistantMessage,
  AssistantContextBlock,
  AssistantContextRequest,
  AssistantDebugBlock,
  AssistantDebugPayload,
  AssistantChatResponse,
  AssistantConversationsResponse,
  AssistantConversationDetailResponse,
  ProviderConfig,
} from './models/assistant.models';

export {
  AssistantValidationError,
  ChatRequestSchema,
  CreateConversationSchema,
  ConversationIdParamSchema,
  type ChatRequestInput,
  type CreateConversationInput,
} from './validation/assistant.schema';

export { STARTERS } from './constants/assistant-instructions';
