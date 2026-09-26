import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { assistantConversations, assistantMessages } from '@/lib/db/schema';
import { MODEL_CONTEXT_LIMIT } from '../../constants/assistant-instructions';
import type {
  AssistantConversation,
  AssistantMessage,
  AssistantRole,
} from '../../models/assistant.models';

function toConversation(row: typeof assistantConversations.$inferSelect): AssistantConversation {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toMessage(row: typeof assistantMessages.$inferSelect): AssistantMessage {
  return {
    id: row.id,
    role: row.role as AssistantRole,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export function getConversationTitle(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, ' ').trim();
  return normalized.length <= 56 ? normalized : `${normalized.slice(0, 53)}...`;
}

export class AssistantRepository {
  async listConversations(userId: string): Promise<AssistantConversation[]> {
    const rows = await db
      .select()
      .from(assistantConversations)
      .where(eq(assistantConversations.userId, userId))
      .orderBy(desc(assistantConversations.updatedAt));

    return rows.map(toConversation);
  }

  async createConversation(userId: string, firstPrompt: string): Promise<AssistantConversation> {
    const now = new Date();
    const [row] = await db
      .insert(assistantConversations)
      .values({
        id: randomUUID(),
        userId,
        title: getConversationTitle(firstPrompt),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toConversation(row);
  }

  async findConversation(
    userId: string,
    conversationId: string
  ): Promise<AssistantConversation | null> {
    const [row] = await db
      .select()
      .from(assistantConversations)
      .where(
        and(
          eq(assistantConversations.id, conversationId),
          eq(assistantConversations.userId, userId)
        )
      )
      .limit(1);

    return row ? toConversation(row) : null;
  }

  async getMessages(conversationId: string): Promise<AssistantMessage[]> {
    const rows = await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, conversationId))
      .orderBy(asc(assistantMessages.createdAt));

    return rows.map(toMessage);
  }

  async getModelContext(
    conversationId: string,
    limit: number = MODEL_CONTEXT_LIMIT
  ): Promise<Array<{ role: AssistantRole; content: string }>> {
    const rows = await db
      .select()
      .from(assistantMessages)
      .where(eq(assistantMessages.conversationId, conversationId))
      .orderBy(desc(assistantMessages.createdAt))
      .limit(limit);

    return rows.reverse().map((row) => ({
      role: row.role as AssistantRole,
      content: row.content,
    }));
  }

  async addMessage(
    conversationId: string,
    role: AssistantRole,
    content: string
  ): Promise<AssistantMessage> {
    const now = new Date();
    const [row] = await db
      .insert(assistantMessages)
      .values({
        id: randomUUID(),
        conversationId,
        role,
        content,
        createdAt: now,
      })
      .returning();

    await db
      .update(assistantConversations)
      .set({ updatedAt: now })
      .where(eq(assistantConversations.id, conversationId));

    return toMessage(row);
  }

  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    const deleted = await db
      .delete(assistantConversations)
      .where(
        and(
          eq(assistantConversations.id, conversationId),
          eq(assistantConversations.userId, userId)
        )
      )
      .returning({ id: assistantConversations.id });

    return deleted.length > 0;
  }
}

export const assistantRepository = new AssistantRepository();
