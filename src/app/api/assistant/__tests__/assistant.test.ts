import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

const { createClient, createResponse } = vi.hoisted(() => ({
  createClient: vi.fn(),
  createResponse: vi.fn(),
}));
const { assistantService } = vi.hoisted(() => ({
  assistantService: {
    addAssistantMessage: vi.fn(),
    createAssistantConversation: vi.fn(),
    deleteAssistantConversation: vi.fn(),
    findAssistantConversation: vi.fn(),
    getAssistantMessages: vi.fn(),
    getAssistantModelContext: vi.fn(),
    listAssistantConversations: vi.fn(),
  },
}));
const { playerContextService } = vi.hoisted(() => ({
  playerContextService: {
    buildAssistantContext: vi.fn(),
    formatAssistantContextBlocks: vi.fn(),
  },
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    constructor(options: unknown) {
      createClient(options);
    }

    responses = {
      create: createResponse,
    };
  },
}));

vi.mock('@/lib/services/features/assistantService', () => assistantService);
vi.mock('@/lib/services/features/assistantContextService', () => playerContextService);

const CONVERSATION_ID = '2ebbd3be-c3d5-405d-86c6-d688946955bc';
const conversation = {
  id: CONVERSATION_ID,
  title: 'Que es un agente?',
  createdAt: new Date('2026-05-26T10:00:00Z'),
  updatedAt: new Date('2026-05-26T10:00:00Z'),
};
const userMessage = {
  id: 'message-user',
  role: 'user',
  content: 'Que es un agente?',
  createdAt: new Date('2026-05-26T10:01:00Z'),
};
const assistantMessage = {
  id: 'message-assistant',
  role: 'assistant',
  content: 'Un agente puede utilizar herramientas.',
  createdAt: new Date('2026-05-26T10:01:01Z'),
};

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/assistant', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('assistant route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('AI_PROVIDER', 'groq');
    vi.stubEnv('GROQ_API_KEY', 'test-groq-api-key');
    vi.stubEnv('GROQ_MODEL', 'openai/gpt-oss-20b');
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as any);
    assistantService.findAssistantConversation.mockResolvedValue(conversation);
    assistantService.getAssistantModelContext.mockResolvedValue([userMessage]);
    assistantService.addAssistantMessage
      .mockResolvedValueOnce(userMessage)
      .mockResolvedValueOnce(assistantMessage);
    assistantService.listAssistantConversations.mockResolvedValue([conversation]);
    assistantService.createAssistantConversation.mockResolvedValue(conversation);
    assistantService.getAssistantMessages.mockResolvedValue([userMessage, assistantMessage]);
    assistantService.deleteAssistantConversation.mockResolvedValue(true);
    playerContextService.buildAssistantContext.mockResolvedValue([]);
    playerContextService.formatAssistantContextBlocks.mockReturnValue(null);
  });

  it('rejects unauthenticated requests before calling the model', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(jsonRequest({ conversationId: CONVERSATION_ID, message: 'Hola' }));

    expect(response.status).toBe(401);
    expect(createResponse).not.toHaveBeenCalled();
  });

  it('validates the conversation input', async () => {
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(jsonRequest({ conversationId: 'bad-id', message: '' }));

    expect(response.status).toBe(400);
    expect(createResponse).not.toHaveBeenCalled();
  });

  it('rejects a conversation that is not owned by the signed-in user', async () => {
    assistantService.findAssistantConversation.mockResolvedValue(null);
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(jsonRequest({ conversationId: CONVERSATION_ID, message: 'Hola' }));

    expect(response.status).toBe(404);
    expect(assistantService.addAssistantMessage).not.toHaveBeenCalled();
    expect(createResponse).not.toHaveBeenCalled();
  });

  it('returns the model response for a signed-in user', async () => {
    createResponse.mockResolvedValue({ output_text: 'Un agente puede utilizar herramientas.' });
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest({ conversationId: CONVERSATION_ID, message: 'Que es un agente?' })
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
    expect(assistantService.findAssistantConversation).toHaveBeenCalledWith('42', CONVERSATION_ID);
    expect(assistantService.addAssistantMessage).toHaveBeenCalledWith(
      CONVERSATION_ID,
      'user',
      'Que es un agente?'
    );
    expect(playerContextService.buildAssistantContext).toHaveBeenCalledWith({
      userId: '42',
      message: 'Que es un agente?',
    });
    expect(createResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining('BiwengerStats assistant'),
        model: 'openai/gpt-oss-20b',
        input: [userMessage],
      })
    );
    expect(assistantService.addAssistantMessage).toHaveBeenLastCalledWith(
      CONVERSATION_ID,
      'assistant',
      'Un agente puede utilizar herramientas.'
    );
    expect(createClient).toHaveBeenCalledWith({
      apiKey: 'test-groq-api-key',
      baseURL: 'https://api.groq.com/openai/v1',
    });
  });

  it('passes read-only player context to the model when a player is found', async () => {
    playerContextService.buildAssistantContext.mockResolvedValue([
      {
        label: 'Player context',
        content: 'Jugador: Walter Tavares\nEquipo: Real Madrid\nMedia fantasy temporada: 16.4',
      },
    ]);
    playerContextService.formatAssistantContextBlocks.mockReturnValue(
      '## Player context\nJugador: Walter Tavares\nEquipo: Real Madrid\nMedia fantasy temporada: 16.4'
    );
    createResponse.mockResolvedValue({ output_text: 'Tavares tiene un perfil muy estable.' });
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(
      jsonRequest({ conversationId: CONVERSATION_ID, message: 'Qué opinas de Tavares?' })
    );

    expect(response.status).toBe(200);
    expect(createResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining('Jugador: Walter Tavares'),
      })
    );
    expect(createResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining('source of truth'),
      })
    );
  });

  it('reports missing server configuration without calling the model', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(jsonRequest({ conversationId: CONVERSATION_ID, message: 'Hola' }));

    expect(response.status).toBe(503);
    expect(assistantService.addAssistantMessage).not.toHaveBeenCalled();
    expect(createResponse).not.toHaveBeenCalled();
  });

  it('reports insufficient model quota clearly', async () => {
    createResponse.mockRejectedValue({ status: 429, code: 'insufficient_quota' });
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(jsonRequest({ conversationId: CONVERSATION_ID, message: 'Hola' }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toContain('límite de uso o cuota');
  });

  it('still supports OpenAI when explicitly selected', async () => {
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-openai-api-key');
    vi.stubEnv('OPENAI_MODEL', 'gpt-5.4-mini');
    createResponse.mockResolvedValue({ output_text: 'Respuesta alternativa.' });
    const { POST } = await import('@/app/api/assistant/route');

    const response = await POST(jsonRequest({ conversationId: CONVERSATION_ID, message: 'Hola' }));

    expect(response.status).toBe(200);
    expect(createClient).toHaveBeenCalledWith({
      apiKey: 'test-openai-api-key',
      baseURL: undefined,
    });
    expect(createResponse).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-5.4-mini' }));
  });

  it('lists and creates only the signed-in user conversations', async () => {
    const routes = await import('@/app/api/assistant/conversations/route');

    const getResponse = await routes.GET();
    expect(getResponse.status).toBe(200);
    expect(assistantService.listAssistantConversations).toHaveBeenCalledWith('42');

    const postResponse = await routes.POST(jsonRequest({ firstPrompt: 'Que es un agente?' }));
    expect(postResponse.status).toBe(201);
    expect(assistantService.createAssistantConversation).toHaveBeenCalledWith(
      '42',
      'Que es un agente?'
    );
  });

  it('loads and deletes an owned conversation', async () => {
    const routes = await import('@/app/api/assistant/conversations/[id]/route');
    const context = { params: Promise.resolve({ id: CONVERSATION_ID }) };

    const getResponse = await routes.GET(new Request('http://localhost'), context);
    expect(getResponse.status).toBe(200);
    expect(assistantService.getAssistantMessages).toHaveBeenCalledWith(CONVERSATION_ID);

    const deleteResponse = await routes.DELETE(new Request('http://localhost'), context);
    expect(deleteResponse.status).toBe(200);
    expect(assistantService.deleteAssistantConversation).toHaveBeenCalledWith(
      '42',
      CONVERSATION_ID
    );
  });

  it('rejects unauthenticated conversation listing', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const { GET } = await import('@/app/api/assistant/conversations/route');

    const response = await GET();

    expect(response.status).toBe(401);
    expect(assistantService.listAssistantConversations).not.toHaveBeenCalled();
  });
});
