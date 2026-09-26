import { auth } from '@/auth';
import {
  assistantCommandService,
  AssistantConversationNotFoundError,
  AssistantProviderError,
  AssistantValidationError,
} from '@/features/assistant/server';
import { errorResponse, privateJsonResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('El mensaje o la conversación no son válidos.', 400);
    }

    const data = await assistantCommandService.sendMessage(session.user.id, body);

    return privateJsonResponse({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof AssistantValidationError) {
      return errorResponse(error.message, 400);
    }

    if (error instanceof AssistantConversationNotFoundError) {
      return errorResponse(error.message, 404);
    }

    if (error instanceof AssistantProviderError) {
      return errorResponse(error.message, error.statusCode);
    }

    console.error('[API Assistant] Error:', error);
    return errorResponse('No se ha podido obtener una respuesta del asistente.', 500);
  }
}
