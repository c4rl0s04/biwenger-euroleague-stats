import { z } from 'zod';
import { auth } from '@/auth';
import {
  deleteAssistantConversation,
  findAssistantConversation,
  getAssistantMessages,
} from '@/lib/services/features/assistantService';
import { errorResponse } from '@/lib/utils/response';
import { NextResponse } from 'next/server';

const idSchema = z.string().uuid();

async function getOwnedConversation(userId: string, rawId: string) {
  const parsedId = idSchema.safeParse(rawId);
  if (!parsedId.success) return null;
  return findAssistantConversation(userId, parsedId.data);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    const { id } = await params;
    const conversation = await getOwnedConversation(session.user.id, id);

    if (!conversation) {
      return errorResponse('La conversación no existe o no pertenece al usuario.', 404);
    }

    const messages = await getAssistantMessages(conversation.id);

    return NextResponse.json(
      { success: true, data: { conversation, messages } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[API Assistant Conversation] Error:', error);
    return errorResponse('No se ha podido cargar la conversación.', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    const { id } = await params;
    const conversation = await getOwnedConversation(session.user.id, id);

    if (!conversation) {
      return errorResponse('La conversación no existe o no pertenece al usuario.', 404);
    }

    await deleteAssistantConversation(session.user.id, conversation.id);

    return NextResponse.json(
      { success: true, data: { id: conversation.id } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[API Assistant Conversation] Error:', error);
    return errorResponse('No se ha podido eliminar la conversación.', 500);
  }
}
