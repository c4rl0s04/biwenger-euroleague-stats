import 'server-only';

export {
  AssistantRepository,
  assistantRepository,
  getConversationTitle,
} from './server/repositories/assistant.repository';

export {
  AssistantProviderService,
  assistantProviderService,
  AssistantProviderError,
} from './server/services/assistant-provider.service';

export {
  buildAssistantContext,
  formatAssistantContextBlocks,
  getAssistantContextProviderNamesForMessage,
} from './server/services/assistant-context.service';

export {
  extractPlayerSearchCandidates,
  buildPlayerContextForMessage,
} from './server/services/assistant-player-context.service';

export {
  AssistantCommandService,
  assistantCommandService,
  AssistantConversationNotFoundError,
} from './server/services/assistant-command.service';

export {
  AssistantReadService,
  assistantReadService,
} from './server/services/assistant-read.service';

export {
  ASSISTANT_INSTRUCTIONS,
  DEFAULT_MODELS,
  GROQ_BASE_URL,
  MODEL_CONTEXT_LIMIT,
  MAX_BLOCK_CHARS,
  MAX_TOTAL_CONTEXT_CHARS,
  STOP_WORDS,
  buildInstructions,
  type AssistantProvider,
} from './constants/assistant-instructions';

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
