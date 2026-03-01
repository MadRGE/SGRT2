import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Trash2, AlertCircle, Settings, Sparkles } from 'lucide-react';
import { isAnthropicAvailable } from '../lib/anthropic';
import { sendChatWithProvider, type ChatMessage } from '../lib/chatProvider';
import { isOllamaConfigured } from '../lib/ollama';
import { getChatProvider, setChatProvider, type ChatProvider } from '../lib/apiKeys';

interface Props {
  onNavigate: (page: any) => void;
}

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const OLLAMA_SYSTEM_PROMPT = `Sos un asistente experto en regulación sanitaria argentina, especializado en trámites ante ANMAT (Administración Nacional de Medicamentos, Alimentos y Tecnología Médica).

Tu conocimiento abarca:
- Registro de productos médicos, alimentos, cosméticos, suplementos dietarios y domisanitarios
- Normativas y disposiciones de ANMAT vigentes
- Procesos de habilitación de establecimientos
- Certificaciones de libre venta y exportación
- Buenas prácticas de manufactura (BPM/GMP)
- Rotulado y etiquetado según normativa argentina
- Clasificación de productos según riesgo
- Plazos y requisitos para cada tipo de trámite

Respondé siempre en español argentino, de forma clara, concisa y profesional. Si no estás seguro de algo, indicalo claramente. Cuando sea relevante, citá la normativa aplicable (disposiciones, resoluciones, leyes).`;

const SUGGESTED_QUESTIONS = [
  '¿Qué requisitos necesito para registrar un alimento importado ante ANMAT?',
  '¿Cuál es el proceso para obtener un Certificado de Libre Venta?',
  '¿Cómo clasifico un producto médico según su nivel de riesgo?',
  '¿Qué normativa aplica para el rotulado de cosméticos en Argentina?',
];

export default function AsistenteIA({ onNavigate }: Props) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [provider, setProvider] = useState<ChatProvider>(() => getChatProvider());

  const anthropicOk = isAnthropicAvailable();
  const ollamaOk = isOllamaConfigured();
  const available = anthropicOk || ollamaOk;

  const handleProviderChange = (p: ChatProvider) => {
    setProvider(p);
    setChatProvider(p);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // Auto-resize textarea
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

    // Build chat history for API
    const chatHistory: ChatMessage[] = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const fullResponse = await sendChatWithProvider(
        chatHistory,
        (partial) => setStreamingText(partial),
        {
          provider,
          systemPrompt: provider === 'ollama' ? OLLAMA_SYSTEM_PROMPT : undefined,
        },
      );

      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingText('');
    } catch (err: any) {
      const providerName = provider === 'ollama' ? 'Ollama' : 'Claude';
      setError(err.message || `Error al comunicarse con ${providerName}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingText('');
    setError(null);
  };

  const formatContent = (text: string) => {
    // Simple markdown-like rendering
    return text
      .split('\n')
      .map((line) => {
        // Bold
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Inline code
        processed = processed.replace(/`(.+?)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
        // Headers
        if (processed.startsWith('### ')) {
          return `<h3 class="font-bold text-base mt-3 mb-1 text-slate-800">${processed.slice(4)}</h3>`;
        }
        if (processed.startsWith('## ')) {
          return `<h2 class="font-bold text-lg mt-3 mb-1 text-slate-800">${processed.slice(3)}</h2>`;
        }
        // List items
        if (processed.startsWith('- ') || processed.startsWith('* ')) {
          return `<li class="ml-4 list-disc text-slate-700">${processed.slice(2)}</li>`;
        }
        if (/^\d+\.\s/.test(processed)) {
          return `<li class="ml-4 list-decimal text-slate-700">${processed.replace(/^\d+\.\s/, '')}</li>`;
        }
        // Empty line
        if (!processed.trim()) return '<br/>';
        return `<p class="text-slate-700">${processed}</p>`;
      })
      .join('');
  };

  // Empty state - no API key
  if (!available) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Asistente IA</h1>
            <p className="text-sm text-slate-500 mt-1">Asistente regulatorio con Claude</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">IA no configurada</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Para usar el Asistente IA necesitás configurar Anthropic (Claude) o Ollama (local) en la sección de configuración.
          </p>
          <button
            onClick={() => onNavigate({ type: 'configuracion' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Ir a Configuración
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Asistente IA</h1>
            <p className="text-xs text-slate-500">
              Regulación sanitaria ANMAT &middot; {provider === 'ollama' ? 'Ollama' : 'Claude'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => handleProviderChange('anthropic')}
              disabled={!anthropicOk}
              className={`px-3 py-1.5 rounded-md transition-all ${
                provider === 'anthropic'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => handleProviderChange('ollama')}
              disabled={!ollamaOk}
              className={`px-3 py-1.5 rounded-md transition-all ${
                provider === 'ollama'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              Ollama
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar chat
            </button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Welcome state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Asistente Regulatorio</h2>
              <p className="text-sm text-slate-500 mb-8 max-w-md">
                Consultame sobre trámites ANMAT, normativas, requisitos de registro, rotulado, habilitaciones y más.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-sm text-slate-600 hover:text-slate-800 leading-snug"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-50 border border-slate-200 rounded-bl-md'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div
                    className="prose prose-sm max-w-none [&_li]:my-0.5 [&_p]:my-1 [&_br]:my-0"
                    dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                  />
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

          {/* Streaming response */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 bg-slate-50 border border-slate-200 text-sm leading-relaxed">
                {streamingText ? (
                  <div
                    className="prose prose-sm max-w-none [&_li]:my-0.5 [&_p]:my-1 [&_br]:my-0"
                    dangerouslySetInnerHTML={{ __html: formatContent(streamingText) }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Pensando...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p className="text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 p-4 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta regulatoria..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            {provider === 'ollama'
              ? 'Ollama (modelo local) puede cometer errores. Verificá siempre la normativa vigente en fuentes oficiales.'
              : 'Claude puede cometer errores. Verificá siempre la normativa vigente en fuentes oficiales.'}
          </p>
        </div>
      </div>
    </div>
  );
}
