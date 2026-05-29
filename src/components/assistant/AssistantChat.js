'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Plus, SendHorizontal, Trash2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STARTERS = [
  'Ayúdame a decidir entre dos jugadores para mi lineup.',
  '¿Cómo debería pensar una venta en el mercado?',
  'Explícame cómo analizar la regularidad de un jugador.',
];

function AssistantMarkdown({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a
            {...props}
            className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-2 border-primary/50 pl-3 text-muted-foreground">
            {children}
          </blockquote>
        ),
        code: ({ className, children }) =>
          className ? (
            <code className={`${className} text-xs`}>{children}</code>
          ) : (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-orange-200">
              {children}
            </code>
          ),
        h1: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold">{children}</h3>,
        h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold">{children}</h3>,
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-semibold">{children}</h3>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5">{children}</ol>,
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg border border-border/50 bg-black/30 p-3 text-xs">
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border/60 bg-white/5 px-3 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border/60 px-3 py-2 align-top">{children}</td>
        ),
        ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

async function parseResponse(response, fallbackMessage) {
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || fallbackMessage);
  }
  return data.data;
}

export default function AssistantChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const chatViewportRef = useRef(null);
  const messageRequestRef = useRef(0);

  const loadConversation = useCallback(async (conversationId) => {
    const requestId = ++messageRequestRef.current;
    setActiveConversationId(conversationId);
    setLoadingMessages(true);
    setError('');

    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        cache: 'no-store',
      });
      const data = await parseResponse(response, 'No se ha podido cargar la conversación.');
      if (messageRequestRef.current === requestId) {
        setMessages(data.messages);
      }
    } catch (requestError) {
      if (messageRequestRef.current === requestId) {
        setMessages([]);
        setError(requestError.message || 'No se ha podido cargar la conversación.');
      }
    } finally {
      if (messageRequestRef.current === requestId) {
        setLoadingMessages(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const response = await fetch('/api/assistant/conversations', { cache: 'no-store' });
        const data = await parseResponse(response, 'No se han podido cargar las conversaciones.');
        if (cancelled) return;
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          await loadConversation(data.conversations[0].id);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || 'No se han podido cargar las conversaciones.');
        }
      } finally {
        if (!cancelled) {
          setLoadingConversations(false);
        }
      }
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [loadConversation]);

  useEffect(() => {
    const viewport = chatViewportRef.current;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, loading, loadingMessages]);

  function beginNewConversation() {
    if (loading) return;
    messageRequestRef.current += 1;
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setError('');
    setLoadingMessages(false);
  }

  async function createConversation(firstPrompt) {
    const response = await fetch('/api/assistant/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstPrompt }),
    });
    const data = await parseResponse(response, 'No se ha podido crear la conversación.');

    setConversations((current) => [
      data.conversation,
      ...current.filter((conversation) => conversation.id !== data.conversation.id),
    ]);
    setActiveConversationId(data.conversation.id);
    return data.conversation.id;
  }

  async function submitMessage(value) {
    const content = value.trim();
    if (!content || loading || loadingMessages) return;

    setInput('');
    setError('');
    setLoading(true);

    try {
      const conversationId = activeConversationId || (await createConversation(content));
      const pendingId = `pending-${Date.now()}`;
      setMessages((current) => [...current, { id: pendingId, role: 'user', content }]);

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: content }),
      });
      const data = await parseResponse(response, 'No se ha podido obtener una respuesta.');

      setMessages((current) => [
        ...current.filter((message) => message.id !== pendingId),
        data.userMessage,
        data.assistantMessage,
      ]);
      setConversations((current) => {
        const selected = current.find((conversation) => conversation.id === conversationId);
        if (!selected) return current;
        return [
          { ...selected, updatedAt: data.assistantMessage.createdAt },
          ...current.filter((conversation) => conversation.id !== conversationId),
        ];
      });
    } catch (requestError) {
      setError(
        requestError.message ||
          'No se ha podido conectar con el asistente. El mensaje puede haber quedado guardado.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitMessage(input);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  async function removeConversation(conversationId) {
    if (loading || !window.confirm('¿Eliminar esta conversación y todos sus mensajes?')) return;

    setError('');
    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      await parseResponse(response, 'No se ha podido eliminar la conversación.');
      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      setConversations(remaining);

      if (activeConversationId === conversationId) {
        if (remaining.length > 0) {
          await loadConversation(remaining[0].id);
        } else {
          beginNewConversation();
        }
      }
    } catch (requestError) {
      setError(requestError.message || 'No se ha podido eliminar la conversación.');
    }
  }

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-2xl shadow-black/20 backdrop-blur-xl lg:min-h-[650px] lg:flex-row">
      <aside className="border-b border-border/50 bg-background/20 p-3 lg:w-64 lg:border-r lg:border-b-0">
        <button
          type="button"
          onClick={beginNewConversation}
          disabled={loading}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-3 py-2.5 text-sm text-primary transition-colors hover:bg-primary/15 disabled:opacity-40"
        >
          <Plus size={16} />
          Nuevo chat
        </button>
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Conversaciones
        </p>
        <div className="flex max-h-44 gap-2 overflow-x-auto lg:max-h-[550px] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
          {loadingConversations && (
            <p className="px-2 py-3 text-sm text-muted-foreground">Cargando...</p>
          )}
          {!loadingConversations && conversations.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">Aún no hay chats guardados.</p>
          )}
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex min-w-52 items-center gap-1 rounded-xl border p-1 lg:min-w-0 ${
                conversation.id === activeConversationId
                  ? 'border-primary/35 bg-primary/10'
                  : 'border-transparent hover:bg-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => loadConversation(conversation.id)}
                disabled={loading}
                className="min-w-0 flex-1 px-2 py-2 text-left disabled:opacity-50"
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <MessageSquare size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{conversation.title}</span>
                </span>
                <span className="ml-6 text-xs text-muted-foreground">
                  {formatDate(conversation.updatedAt)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeConversation(conversation.id)}
                disabled={loading}
                className="rounded-lg p-2 text-muted-foreground opacity-0 transition hover:text-red-300 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0"
                aria-label="Eliminar conversación"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">
              {activeConversation?.title || 'Asistente BiwengerStats'}
            </p>
            <p className="text-xs text-muted-foreground">
              Estrategia fantasy y conversaciones guardadas en tu cuenta
            </p>
          </div>
        </div>

        <div
          ref={chatViewportRef}
          className="flex min-h-[420px] flex-1 flex-col gap-4 overflow-y-auto p-5 md:p-7"
          aria-live="polite"
        >
          {loadingMessages && (
            <p className="m-auto text-sm text-muted-foreground">Cargando conversación...</p>
          )}

          {!loadingMessages && messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
              <div className="max-w-md space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  Pregunta sobre estrategia fantasy
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Puedes pedir ayuda para razonar lineups, mercado, tendencias y decisiones de
                  Biwenger. Todavía no consulta tus datos en vivo ni ejecuta acciones.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => submitMessage(starter)}
                    disabled={loading}
                    className="rounded-full border border-border/60 bg-background/50 px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loadingMessages &&
            messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bot size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-primary text-white'
                        : 'border border-border/50 bg-background/60 text-foreground'
                    }`}
                  >
                    {isUser ? (
                      <span className="whitespace-pre-wrap break-words">{message.content}</span>
                    ) : (
                      <AssistantMarkdown content={message.content} />
                    )}
                  </div>
                  {isUser && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-muted-foreground">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot size={16} />
              </div>
              <div className="flex gap-1 rounded-2xl border border-border/50 bg-background/60 px-4 py-4">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground"
                    style={{ animationDelay: `${dot * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border/50 p-4 md:p-5">
          {error && (
            <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre lineup, mercado o estrategia..."
              rows={1}
              maxLength={4000}
              disabled={loadingMessages}
              className="min-h-12 flex-1 resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || loadingMessages}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Enviar mensaje"
            >
              <SendHorizontal size={19} />
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Esta etapa no consulta datos en vivo de BiwengerStats. No tomes sus respuestas como
            datos oficiales.
          </p>
        </form>
      </div>
    </div>
  );
}
