import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  AssistantConversationNotFoundError,
  AssistantProviderError,
  AssistantValidationError,
} from '@/features/assistant/server';

const { assistantCommandServiceMock, assistantReadServiceMock } = vi.hoisted(() => ({
  assistantCommandServiceMock: {
    sendMessage: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
  },
  assistantReadServiceMock: {
    listConversations: vi.fn(),
    getConversation: vi.fn(),
  },
}));

vi.mock('@/features/assistant/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/assistant/server')>();
  return {
    ...actual,
    assistantCommandService: assistantCommandServiceMock,
    assistantReadService: assistantReadServiceMock,
  };
});

const CONVERSATION_ID = '2ebbd3be-c3d5-405d-86c6-d688946955bc';
const conversation = {
  id: CONVERSATION_ID,
  title: 'Que es un agente?',
  createdAt: new Date('2026-05-26T10:00:00Z'),
  updatedAt: new Date('2026-05-26T10:00:00Z'),
};
const userMessage = {
  id: 'message-user',
  role: 'user' as const,
  content: 'Que es un agente?',
  createdAt: new Date('2026-05-26T10:01:00Z'),
};
const assistantMessage = {
  id: 'message-assistant',
  role: 'assistant' as const,
  content: 'Un agente puede utilizar herramientas.',
  createdAt: new Date('2026-05-26T10:01:01Z'),
};

function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('assistant route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as any);
    assistantReadServiceMock.listConversations.mockResolvedValue({
      conversations: [conversation],
    });
    assistantReadServiceMock.getConversation.mockResolvedValue({
      conversation,
      messages: [userMessage, assistantMessage],
    });
    assistantCommandServiceMock.createConversation.mockResolvedValue(conversation);
    assistantCommandServiceMock.deleteConversation.mockResolvedValue(true);
    assistantCommandServiceMock.sendMessage.mockResolvedValue({
      conversationId: CONVERSATION_ID,
      userMessage,
      assistantMessage,
    });
  });

  it('rejects unauthenticated requests before calling the model', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: CONVERSATION_ID,
        message: 'Hola',
      })
    );

    expect(response.status).toBe(401);
    expect(assistantCommandServiceMock.sendMessage).not.toHaveBeenCalled();
  });

  it('validates the conversation input', async () => {
    assistantCommandServiceMock.sendMessage.mockRejectedValue(
      new AssistantValidationError('El mensaje o la conversación no son válidos.')
    );
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: 'bad-id',
        message: '',
      })
    );

    expect(response.status).toBe(400);
  });

  it('rejects a conversation that is not owned by the signed-in user', async () => {
    assistantCommandServiceMock.sendMessage.mockRejectedValue(
      new AssistantConversationNotFoundError('La conversación no existe o no pertenece al usuario.')
    );
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: CONVERSATION_ID,
        message: 'Hola',
      })
    );

    expect(response.status).toBe(404);
  });

  it('returns the model response for a signed-in user', async () => {
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: CONVERSATION_ID,
        message: 'Que es un agente?',
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      success: true,
      data: {
        conversationId: CONVERSATION_ID,
        userMessage: { ...userMessage, createdAt: userMessage.createdAt.toISOString() },
        assistantMessage: {
          ...assistantMessage,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
      },
    });
    expect(assistantCommandServiceMock.sendMessage).toHaveBeenCalledWith('42', {
      conversationId: CONVERSATION_ID,
      message: 'Que es un agente?',
    });
  });

  it('includes assistant context debug details when returned', async () => {
    const debug = {
      selectedProviders: ['predictions'],
      totalContextChars: 66,
      blocks: [
        {
          label: 'Prediction context',
          chars: 66,
          content: 'Modelo usado: heurística transparente\nTavares: proyección 16.2 pts',
        },
      ],
    };
    assistantCommandServiceMock.sendMessage.mockResolvedValue({
      conversationId: CONVERSATION_ID,
      userMessage,
      assistantMessage,
      debug,
    });

    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: CONVERSATION_ID,
        message: 'Predice a Tavares',
      })
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.debug).toEqual(debug);
  });

  it('reports missing server configuration without calling the model', async () => {
    assistantCommandServiceMock.sendMessage.mockRejectedValue(
      new AssistantProviderError('El asistente no está configurado en el servidor.', 503)
    );
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: CONVERSATION_ID,
        message: 'Hola',
      })
    );

    expect(response.status).toBe(503);
  });

  it('reports insufficient model quota clearly', async () => {
    assistantCommandServiceMock.sendMessage.mockRejectedValue(
      new AssistantProviderError(
        'El proveedor de IA ha alcanzado su límite de uso o cuota disponible.',
        503
      )
    );
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest('http://localhost/api/assistant', {
        conversationId: CONVERSATION_ID,
        message: 'Hola',
      })
    );
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain('límite de uso o cuota');
  });

  it('lists and creates only the signed-in user conversations', async () => {
    const routes = await import('@/app/api/assistant/conversations/route');

    const getResponse = await routes.GET();
    expect(getResponse.status).toBe(200);
    expect(assistantReadServiceMock.listConversations).toHaveBeenCalledWith('42');

    const postResponse = await routes.POST(
      jsonRequest('http://localhost/api/assistant/conversations', {
        firstPrompt: 'Que es un agente?',
      })
    );
    expect(postResponse.status).toBe(201);
    expect(assistantCommandServiceMock.createConversation).toHaveBeenCalledWith('42', {
      firstPrompt: 'Que es un agente?',
    });
  });

  it('loads and deletes an owned conversation', async () => {
    const routes = await import('@/app/api/assistant/conversations/[id]/route');
    const context = { params: Promise.resolve({ id: CONVERSATION_ID }) };

    const getResponse = await routes.GET(new Request('http://localhost'), context);
    expect(getResponse.status).toBe(200);
    expect(assistantReadServiceMock.getConversation).toHaveBeenCalledWith('42', CONVERSATION_ID);

    const deleteResponse = await routes.DELETE(new Request('http://localhost'), context);
    expect(deleteResponse.status).toBe(200);
    expect(assistantCommandServiceMock.deleteConversation).toHaveBeenCalledWith(
      '42',
      CONVERSATION_ID
    );
  });

  it('rejects unauthenticated conversation listing', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const { GET } = await import('@/app/api/assistant/conversations/route');

    const response = await GET();

    expect(response.status).toBe(401);
    expect(assistantReadServiceMock.listConversations).not.toHaveBeenCalled();
  });
});
