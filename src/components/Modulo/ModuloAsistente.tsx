/**
 * ModuloAsistente — AI chat assistant customized per regulatory module.
 * Each module (INAL, SENASA, ANMAT) gets its own system prompt and suggested questions.
 * Free for all users.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Trash2, AlertCircle, Sparkles } from 'lucide-react';
import { sendChatWithProvider, type ChatMessage } from '../../lib/chatProvider';
import { isAnthropicAvailable } from '../../lib/anthropic';
import { isOllamaConfigured } from '../../lib/ollama';
import { getChatProvider, type ChatProvider } from '../../lib/apiKeys';

interface Props {
  modulo: string;
  color: string;           // gradient classes e.g. 'from-emerald-500 to-teal-600'
  systemPrompt: string;
  suggestedQuestions: string[];
  placeholder?: string;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ModuloAsistente({ modulo, color, systemPrompt, suggestedQuestions, placeholder }: Props) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const provider: ChatProvider = getChatProvider();

  const anthropicOk = isAnthropicAvailable();
  const ollamaOk = isOllamaConfigured();
  const available = anthropicOk || ollamaOk;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = async (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText || isLoading) return;

    setError(null);
    setInput('');

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: msgText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setStreamingText('');

    const chatHistory: ChatMessage[] = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const fullResponse = await sendChatWithProvider(
        chatHistory,
        (partial) => setStreamingText(partial),
        { provider, systemPrompt },
      );

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      }]);
      setStreamingText('');
    } catch (err: any) {
      setError(err.message || 'Error al comunicarse con el asistente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line) => {
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/`(.+?)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
      if (processed.startsWith('### ')) return `<h3 class="font-bold text-base mt-3 mb-1 text-slate-800">${processed.slice(4)}</h3>`;
      if (processed.startsWith('## ')) return `<h2 class="font-bold text-lg mt-3 mb-1 text-slate-800">${processed.slice(3)}</h2>`;
      if (processed.startsWith('- ') || processed.startsWith('* ')) return `<li class="ml-4 list-disc text-slate-700">${processed.slice(2)}</li>`;
      if (/^\d+\.\s/.test(processed)) return `<li class="ml-4 list-decimal text-slate-700">${processed.replace(/^\d+\.\s/, '')}</li>`;
      if (!processed.trim()) return '<br/>';
      return `<p class="text-slate-700">${processed}</p>`;
    }).join('');
  };

  if (!available) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Asistente no disponible</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Configurá Anthropic (Claude) u Ollama en la sección de Configuración para usar el asistente de {modulo}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Welcome */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Asistente {modulo}</h2>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                Consultame gratis sobre trámites, requisitos, normativas y procedimientos de {modulo}. Estoy para ayudarte.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all text-sm text-slate-600 hover:text-slate-800 leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 mt-1`}>
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-slate-50 border border-slate-200 rounded-bl-md'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none [&_li]:my-0.5 [&_p]:my-1" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                )}
                <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 mt-1`}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-slate-50 border border-slate-200 text-sm">
                {streamingText ? (
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formatContent(streamingText) }} />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Pensando...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || `Consultá sobre ${modulo}...`}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-slate-400">
              Servicio gratuito &middot; El asistente puede cometer errores, verificá en fuentes oficiales.
            </p>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setStreamingText(''); setError(null); }}
                className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
