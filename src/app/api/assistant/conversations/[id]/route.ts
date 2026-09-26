import { auth } from '@/auth';
import {
  assistantCommandService,
  assistantReadService,
  AssistantConversationNotFoundError,
  AssistantValidationError,
} from '@/features/assistant/server';
import { errorResponse, privateJsonResponse } from '@/lib/utils/response';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    const { id } = await params;
    const data = await assistantReadService.getConversation(session.user.id, id);

    if (!data) {
      return errorResponse('La conversación no existe o no pertenece al usuario.', 404);
    }

    return privateJsonResponse({ success: true, data });
  } catch (error) {
    if (error instanceof AssistantValidationError) {
      return errorResponse(error.message, 400);
    }

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
    await assistantCommandService.deleteConversation(session.user.id, id);

    return privateJsonResponse({ success: true, data: { id } });
  } catch (error) {
    if (error instanceof AssistantValidationError) {
      return errorResponse(error.message, 400);
    }

    if (error instanceof AssistantConversationNotFoundError) {
      return errorResponse(error.message, 404);
    }

    console.error('[API Assistant Conversation] Error:', error);
    return errorResponse('No se ha podido eliminar la conversación.', 500);
  }
}
