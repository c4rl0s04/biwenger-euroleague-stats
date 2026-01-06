'use client';

import { useChat } from '@ai-sdk/react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AIPage() {
  // Local state for input to ensure controlled component & manual submission
  const [localInput, setLocalInput] = useState('');
  
  const chatHelpers = useChat();
  const { messages, isLoading, error } = chatHelpers;
  const append = chatHelpers.append || chatHelpers.sendMessage;

  const messagesEndRef = useRef(null);

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;

    const userMessage = localInput;
    setLocalInput(''); // Clear input immediately
    
    if (append) {
      await append({ role: 'user', content: userMessage });
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, error, isLoading]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex-1 bg-card/50 border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col backdrop-blur-sm relative">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-border/40 bg-background/50 flex items-center gap-4">
             <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                <Sparkles className="text-white w-6 h-6" />
             </div>
             <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                    AI Assistant
                </h1>
                <p className="text-sm text-muted-foreground">Powered by Gemini 1.5 Flash</p>
             </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-60">
              <div className="p-6 bg-secondary/30 rounded-full mb-4">
                  <Bot size={64} className="text-primary/40" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-medium text-foreground">¿En qué puedo ayudarte?</h3>
                <p className="text-sm text-muted-foreground">
                  Pregúntame sobre estadísticas de jugadores, la clasificación actual o recomendaciones de mercado.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg mt-8">
                 {['¿Quién va líder?', 'Estadísticas de mi equipo', 'Top 5 jugadores', 'Valor de mercado de Bellingham'].map((q) => (
                    <button 
                        key={q}
                        onClick={() => {
                            setLocalInput(q);
                            if(append) append({ role: 'user', content: q });
                        }}
                        className="text-xs p-3 rounded-lg border border-border/40 bg-background/40 hover:bg-primary/10 hover:border-primary/30 transition-all text-left"
                    >
                        {q}
                    </button>
                 ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={m.id}
              className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row items-start'}`}
            >
              <div
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white' 
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {m.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
              </div>
              <div
                className={`rounded-2xl px-6 py-4 text-sm md:text-base max-w-[85%] shadow-sm ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-secondary/80 text-foreground rounded-tl-sm border border-border/50'
                }`}
              >
                 <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                 
                 {/* Tool Usage Indicator */}
                 {m.toolInvocations?.map(tool => (
                    <div key={tool.toolCallId} className="mt-3 flex items-center gap-2 text-xs bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full w-fit">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/>
                      <span className="opacity-70 font-mono">Running: {tool.toolName}</span>
                    </div>
                 ))}
              </div>
            </motion.div>
          ))}
          
          {/* Loading Indicator */}
          {isLoading && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4 items-center ml-1"
            >
                <div className="w-10 h-10 rounded-full bg-indigo-600/10 flex items-center justify-center">
                    <Sparkles size={18} className="text-indigo-500 animate-pulse" />
                </div>
                <div className="flex gap-2 items-center text-muted-foreground text-xs">
                   <div className="flex gap-1">
                     <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce" />
                     <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce delay-75" />
                     <span className="w-1.5 h-1.5 bg-indigo-500/50 rounded-full animate-bounce delay-150" />
                   </div>
                   <span className="text-[10px] uppercase tracking-wider font-semibold opacity-50">Thinking...</span>
                </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
             <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl mx-auto w-fit flex items-center gap-3">
               <div className="p-2 bg-red-500/20 rounded-full">
                 <Bot size={16} />
               </div>
               <div>
                  <p className="font-semibold">Error</p>
                  <p className="opacity-80 text-xs">{error.message}</p>
               </div>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 border-t border-border/40 bg-background/50 backdrop-blur-md">
            <form onSubmit={handleLocalSubmit} className="relative max-w-4xl mx-auto flex items-end gap-2">
              <div className="relative flex-1">
                <input
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  placeholder="Ask anything about your league..."
                  className="w-full bg-secondary/50 hover:bg-secondary/80 focus:bg-background border border-border/50 rounded-2xl py-4 pl-6 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !localInput.trim()}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-3 opacity-50">
                AI may make mistakes. Check important info.
            </p>
        </div>
      </div>
    </div>
  );
}
