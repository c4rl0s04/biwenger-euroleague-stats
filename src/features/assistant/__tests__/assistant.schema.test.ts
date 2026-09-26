import { describe, expect, it } from 'vitest';
import {
  ChatRequestSchema,
  CreateConversationSchema,
  ConversationIdParamSchema,
  AssistantValidationError,
} from '../validation/assistant.schema';

describe('assistant schemas and validation', () => {
  const validUUID = '2ebbd3be-c3d5-405d-86c6-d688946955bc';

  describe('ChatRequestSchema', () => {
    it('accepts valid chat requests', () => {
      const result = ChatRequestSchema.safeParse({
        conversationId: validUUID,
        message: '¿A quién debería fichar esta jornada?',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conversationId).toBe(validUUID);
        expect(result.data.message).toBe('¿A quién debería fichar esta jornada?');
      }
    });

    it('trims whitespace from message', () => {
      const result = ChatRequestSchema.safeParse({
        conversationId: validUUID,
        message: '   Hola asistente   ',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('Hola asistente');
      }
    });

    it('rejects invalid conversationId UUID', () => {
      const result = ChatRequestSchema.safeParse({
        conversationId: 'invalid-uuid-format',
        message: 'Hola',
      });

      expect(result.success).toBe(false);
    });

    it('rejects empty or whitespace-only messages', () => {
      const resultEmpty = ChatRequestSchema.safeParse({
        conversationId: validUUID,
        message: '',
      });
      const resultWhitespace = ChatRequestSchema.safeParse({
        conversationId: validUUID,
        message: '    ',
      });

      expect(resultEmpty.success).toBe(false);
      expect(resultWhitespace.success).toBe(false);
    });

    it('rejects messages longer than 4000 characters', () => {
      const longMessage = 'a'.repeat(4001);
      const result = ChatRequestSchema.safeParse({
        conversationId: validUUID,
        message: longMessage,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('CreateConversationSchema', () => {
    it('accepts valid first prompt', () => {
      const result = CreateConversationSchema.safeParse({
        firstPrompt: '¿Cuál es la mejor estrategia para la próxima jornada?',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.firstPrompt).toBe(
          '¿Cuál es la mejor estrategia para la próxima jornada?'
        );
      }
    });

    it('rejects empty or excessively long prompt', () => {
      expect(CreateConversationSchema.safeParse({ firstPrompt: '' }).success).toBe(false);
      expect(CreateConversationSchema.safeParse({ firstPrompt: '   ' }).success).toBe(false);
      expect(
        CreateConversationSchema.safeParse({ firstPrompt: 'x'.repeat(4001) }).success
      ).toBe(false);
    });
  });

  describe('ConversationIdParamSchema', () => {
    it('validates UUID strings', () => {
      expect(ConversationIdParamSchema.safeParse(validUUID).success).toBe(true);
      expect(ConversationIdParamSchema.safeParse('not-a-uuid').success).toBe(false);
    });
  });

  describe('AssistantValidationError', () => {
    it('constructs with message and default issues', () => {
      const error = new AssistantValidationError('Error de validación');
      expect(error.name).toBe('AssistantValidationError');
      expect(error.message).toBe('Error de validación');
      expect(error.issues).toEqual([]);
    });
  });
});
