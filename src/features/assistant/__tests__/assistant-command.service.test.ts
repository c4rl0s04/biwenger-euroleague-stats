import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AssistantCommandService,
  AssistantConversationNotFoundError,
} from '../server/services/assistant-command.service';
import { AssistantValidationError } from '../validation/assistant.schema';
import type { AssistantRepository } from '../server/repositories/assistant.repository';
import type { AssistantProviderService } from '../server/services/assistant-provider.service';

const { contextService } = vi.hoisted(() => ({
  contextService: {
    buildAssistantContext: vi.fn(),
    formatAssistantContextBlocks: vi.fn(),
    getAssistantContextProviderNamesForMessage: vi.fn(),
  },
}));

vi.mock('../server/services/assistant-context.service', () => contextService);

describe('AssistantCommandService', () => {
  const mockRepo = {
    createConversation: vi.fn(),
    findConversation: vi.fn(),
    deleteConversation: vi.fn(),
    addMessage: vi.fn(),
    getModelContext: vi.fn(),
    getMessages: vi.fn(),
    listConversations: vi.fn(),
  } as unknown as AssistantRepository;

  const mockProvider = {
    generateResponse: vi.fn(),
    getProvider: vi.fn(),
    getProviderConfig: vi.fn(),
  } as unknown as AssistantProviderService;

  let service: AssistantCommandService;

  const validUUID = '2ebbd3be-c3d5-405d-86c6-d688946955bc';
  const mockConversation = {
    id: validUUID,
    title: 'Estrategia Jornada 5',
    createdAt: new Date('2026-05-20T10:00:00Z'),
    updatedAt: new Date('2026-05-20T10:00:00Z'),
  };
  const mockUserMessage = {
    id: 'msg-user-1',
    role: 'user' as const,
    content: '¿A quién pongo de capitán?',
    createdAt: new Date('2026-05-20T10:01:00Z'),
  };
  const mockAssistantMessage = {
    id: 'msg-asst-1',
    role: 'assistant' as const,
    content: 'Tavares es una gran opción.',
    createdAt: new Date('2026-05-20T10:01:02Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AssistantCommandService(mockRepo, mockProvider);
    contextService.buildAssistantContext.mockResolvedValue([]);
    contextService.formatAssistantContextBlocks.mockReturnValue(null);
    contextService.getAssistantContextProviderNamesForMessage.mockReturnValue([]);
  });

  describe('createConversation', () => {
    it('creates a new conversation for valid input', async () => {
      vi.mocked(mockRepo.createConversation).mockResolvedValue(mockConversation);

      const result = await service.createConversation('user-1', {
        firstPrompt: '¿Cómo va la clasificación?',
      });

      expect(mockRepo.createConversation).toHaveBeenCalledWith(
        'user-1',
        '¿Cómo va la clasificación?'
      );
      expect(result).toEqual(mockConversation);
    });

    it('throws AssistantValidationError when prompt is empty', async () => {
      await expect(service.createConversation('user-1', { firstPrompt: '' })).rejects.toThrow(
        AssistantValidationError
      );
      expect(mockRepo.createConversation).not.toHaveBeenCalled();
    });
  });

  describe('deleteConversation', () => {
    it('throws validation error if conversation ID is not UUID', async () => {
      await expect(service.deleteConversation('user-1', 'invalid-id')).rejects.toThrow(
        AssistantValidationError
      );
      expect(mockRepo.findConversation).not.toHaveBeenCalled();
    });

    it('throws AssistantConversationNotFoundError if conversation not owned by user', async () => {
      vi.mocked(mockRepo.findConversation).mockResolvedValue(null);

      await expect(service.deleteConversation('user-1', validUUID)).rejects.toThrow(
        AssistantConversationNotFoundError
      );
      expect(mockRepo.deleteConversation).not.toHaveBeenCalled();
    });

    it('deletes conversation when owned by user', async () => {
      vi.mocked(mockRepo.findConversation).mockResolvedValue(mockConversation);
      vi.mocked(mockRepo.deleteConversation).mockResolvedValue(true);

      const result = await service.deleteConversation('user-1', validUUID);

      expect(mockRepo.findConversation).toHaveBeenCalledWith('user-1', validUUID);
      expect(mockRepo.deleteConversation).toHaveBeenCalledWith('user-1', validUUID);
      expect(result).toBe(true);
    });
  });

  describe('sendMessage', () => {
    it('throws validation error if input payload is invalid', async () => {
      await expect(
        service.sendMessage('user-1', { conversationId: 'bad-id', message: '' })
      ).rejects.toThrow(AssistantValidationError);
      expect(mockRepo.findConversation).not.toHaveBeenCalled();
    });

    it('throws AssistantConversationNotFoundError if conversation does not exist', async () => {
      vi.mocked(mockRepo.findConversation).mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', {
          conversationId: validUUID,
          message: 'Hola',
        })
      ).rejects.toThrow(AssistantConversationNotFoundError);
      expect(mockRepo.addMessage).not.toHaveBeenCalled();
    });

    it('orchestrates message exchange successfully', async () => {
      vi.mocked(mockRepo.findConversation).mockResolvedValue(mockConversation);
      vi.mocked(mockRepo.addMessage)
        .mockResolvedValueOnce(mockUserMessage)
        .mockResolvedValueOnce(mockAssistantMessage);
      vi.mocked(mockRepo.getModelContext).mockResolvedValue([mockUserMessage]);
      vi.mocked(mockProvider.generateResponse).mockResolvedValue(mockAssistantMessage.content);

      const result = await service.sendMessage('user-1', {
        conversationId: validUUID,
        message: '¿A quién pongo de capitán?',
      });

      expect(mockRepo.findConversation).toHaveBeenCalledWith('user-1', validUUID);
      expect(mockRepo.addMessage).toHaveBeenCalledWith(
        validUUID,
        'user',
        '¿A quién pongo de capitán?'
      );
      expect(contextService.buildAssistantContext).toHaveBeenCalledWith({
        userId: 'user-1',
        message: '¿A quién pongo de capitán?',
      });
      expect(mockProvider.generateResponse).toHaveBeenCalledWith([mockUserMessage], null);
      expect(mockRepo.addMessage).toHaveBeenCalledWith(
        validUUID,
        'assistant',
        mockAssistantMessage.content
      );
      expect(result).toEqual({
        conversationId: validUUID,
        userMessage: mockUserMessage,
        assistantMessage: mockAssistantMessage,
      });
    });
  });
});
