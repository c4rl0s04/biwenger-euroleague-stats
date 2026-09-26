import { auth } from '@/auth';
import {
  assistantCommandService,
  assistantReadService,
  AssistantValidationError,
} from '@/features/assistant/server';
import { errorResponse, privateJsonResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    const data = await assistantReadService.listConversations(session.user.id);

    return privateJsonResponse({ success: true, data });
  } catch (error) {
    console.error('[API Assistant Conversations] Error:', error);
    return errorResponse('No se han podido cargar las conversaciones.', 500);
  }
}

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
      return errorResponse('No se ha podido crear la conversación con ese mensaje.', 400);
    }

    const conversation = await assistantCommandService.createConversation(session.user.id, body);

    return privateJsonResponse({ success: true, data: { conversation } }, 201);
  } catch (error) {
    if (error instanceof AssistantValidationError) {
      return errorResponse(error.message, 400);
    }

    console.error('[API Assistant Conversations] Error:', error);
    return errorResponse('No se ha podido crear la conversación.', 500);
  }
}
