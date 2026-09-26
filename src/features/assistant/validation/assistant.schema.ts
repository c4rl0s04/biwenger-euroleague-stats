import { z } from 'zod';

export class AssistantValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[] = []
  ) {
    super(message);
    this.name = 'AssistantValidationError';
  }
}

export const ChatRequestSchema = z.object({
  conversationId: z.string().uuid({ message: 'El ID de la conversación debe ser un UUID válido.' }),
  message: z
    .string()
    .trim()
    .min(1, { message: 'El mensaje no puede estar vacío.' })
    .max(4000, { message: 'El mensaje no puede superar los 4000 caracteres.' }),
});

export type ChatRequestInput = z.infer<typeof ChatRequestSchema>;

export const CreateConversationSchema = z.object({
  firstPrompt: z
    .string()
    .trim()
    .min(1, { message: 'El mensaje inicial no puede estar vacío.' })
    .max(4000, { message: 'El mensaje inicial no puede superar los 4000 caracteres.' }),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

export const ConversationIdParamSchema = z
  .string()
  .uuid({ message: 'El identificador de conversación debe ser un UUID válido.' });
