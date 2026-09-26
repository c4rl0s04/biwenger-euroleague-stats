import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssistantReadService } from '../server/services/assistant-read.service';
import { AssistantValidationError } from '../validation/assistant.schema';
import type { AssistantRepository } from '../server/repositories/assistant.repository';

describe('AssistantReadService', () => {
  const mockRepo = {
    listConversations: vi.fn(),
    findConversation: vi.fn(),
    getMessages: vi.fn(),
    createConversation: vi.fn(),
    getModelContext: vi.fn(),
    addMessage: vi.fn(),
    deleteConversation: vi.fn(),
  } as unknown as AssistantRepository;

  let service: AssistantReadService;

  const validUUID = '2ebbd3be-c3d5-405d-86c6-d688946955bc';
  const mockConversation = {
    id: validUUID,
    title: 'Estrategia Jornada 5',
    createdAt: new Date('2026-05-20T10:00:00Z'),
    updatedAt: new Date('2026-05-20T10:00:00Z'),
  };
  const mockMessages = [
    {
      id: 'msg-1',
      role: 'user' as const,
      content: '¿A quién alineo?',
      createdAt: new Date('2026-05-20T10:01:00Z'),
    },
    {
      id: 'msg-2',
      role: 'assistant' as const,
      content: 'Te recomiendo a Campazzo.',
      createdAt: new Date('2026-05-20T10:01:05Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AssistantReadService(mockRepo);
  });

  describe('listConversations', () => {
    it('returns conversations wrapped in object', async () => {
      vi.mocked(mockRepo.listConversations).mockResolvedValue([mockConversation]);

      const result = await service.listConversations('user-1');

      expect(mockRepo.listConversations).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ conversations: [mockConversation] });
    });
  });

  describe('getConversation', () => {
    it('throws validation error if conversationId is not a valid UUID', async () => {
      await expect(service.getConversation('user-1', 'not-a-uuid')).rejects.toThrow(
        AssistantValidationError
      );
      expect(mockRepo.findConversation).not.toHaveBeenCalled();
    });

    it('returns null if conversation does not exist or belong to user', async () => {
      vi.mocked(mockRepo.findConversation).mockResolvedValue(null);

      const result = await service.getConversation('user-1', validUUID);

      expect(mockRepo.findConversation).toHaveBeenCalledWith('user-1', validUUID);
      expect(result).toBeNull();
      expect(mockRepo.getMessages).not.toHaveBeenCalled();
    });

    it('returns conversation and messages when found', async () => {
      vi.mocked(mockRepo.findConversation).mockResolvedValue(mockConversation);
      vi.mocked(mockRepo.getMessages).mockResolvedValue(mockMessages);

      const result = await service.getConversation('user-1', validUUID);

      expect(mockRepo.findConversation).toHaveBeenCalledWith('user-1', validUUID);
      expect(mockRepo.getMessages).toHaveBeenCalledWith(validUUID);
      expect(result).toEqual({
        conversation: mockConversation,
        messages: mockMessages,
      });
    });
  });
});
