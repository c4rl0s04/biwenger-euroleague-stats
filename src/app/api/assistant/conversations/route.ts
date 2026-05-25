import { z } from 'zod';
import { auth } from '@/auth';
import {
  createAssistantConversation,
  listAssistantConversations,
} from '@/lib/services/features/assistantService';
import { errorResponse } from '@/lib/utils/response';
import { NextResponse } from 'next/server';

const createConversationSchema = z.object({
  firstPrompt: z.string().trim().min(1).max(4000),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return errorResponse('No autorizado. Debes iniciar sesión para usar el asistente.', 401);
    }

    const conversations = await listAssistantConversations(session.user.id);

    return NextResponse.json(
      { success: true, data: { conversations } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
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

    const parsedRequest = createConversationSchema.safeParse(await request.json());

    if (!parsedRequest.success) {
      return errorResponse('No se ha podido crear la conversación con ese mensaje.', 400);
    }

    const conversation = await createAssistantConversation(
      session.user.id,
      parsedRequest.data.firstPrompt
    );

    return NextResponse.json(
      { success: true, data: { conversation } },
      { status: 201, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[API Assistant Conversations] Error:', error);
    return errorResponse('No se ha podido crear la conversación.', 500);
  }
}
