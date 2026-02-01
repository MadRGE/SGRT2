import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Hash } from 'lucide-react';
import { Message, User } from '../hooks/useLANChat';

interface ChatAreaProps {
  messages: Message[];
  typingUsers: User[];
  currentUserId: number | null;
  onSendMessage: (content: string) => void;
  onTyping: () => void;
}

export function ChatArea({
  messages,
  typingUsers,
  currentUserId,
  onSendMessage,
  onTyping
}: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);

    // Enviar indicador de escritura con debounce
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping();
    }, 300);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
  };

  // Agrupar mensajes por fecha
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  let currentDate = '';

  messages.forEach(msg => {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="flex-1 flex flex-col bg-[#36393f]">
      {/* Header del canal */}
      <div className="h-12 px-4 flex items-center border-b border-[#202225] shadow">
        <Hash size={24} className="text-[#8e9297] mr-2" />
        <span className="font-semibold text-white">general</span>
        <div className="mx-4 w-px h-6 bg-[#4f545c]" />
        <span className="text-[#8e9297] text-sm">Canal para hablar mientras juegan</span>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[#5865f2] flex items-center justify-center mb-4">
              <Hash size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Bienvenido a #general</h3>
            <p className="text-[#8e9297]">
              Este es el comienzo del canal. Envia un mensaje para empezar a chatear.
            </p>
          </div>
        )}

        {groupedMessages.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Separador de fecha */}
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-[#4f545c]" />
              <span className="px-2 text-xs text-[#8e9297] font-semibold">{group.date}</span>
              <div className="flex-1 h-px bg-[#4f545c]" />
            </div>

            {/* Mensajes del grupo */}
            {group.messages.map((msg, msgIndex) => {
              const isSystem = msg.from.id === 0;
              const isOwn = msg.from.id === currentUserId;

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-xs text-[#8e9297] bg-[#2f3136] px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className="flex hover:bg-[#32353b] px-2 py-0.5 -mx-2 rounded group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#5865f2] flex-shrink-0 flex items-center justify-center text-white font-semibold mr-4">
                    {msg.from.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline">
                      <span className={`font-medium ${isOwn ? 'text-[#5865f2]' : 'text-white'}`}>
                        {msg.from.username}
                      </span>
                      <span className="text-xs text-[#72767d] ml-2">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-[#dcddde] break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Indicador de escritura */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-sm text-[#8e9297]">
          <span className="inline-flex items-center">
            <span className="flex space-x-1 mr-2">
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <strong>{typingUsers.map(u => u.username).join(', ')}</strong>
            {typingUsers.length === 1 ? ' esta escribiendo...' : ' estan escribiendo...'}
          </span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-6 pt-2">
        <div className="flex items-center bg-[#40444b] rounded-lg px-4">
          <button
            type="button"
            className="p-2 text-[#b9bbbe] hover:text-white"
          >
            <Smile size={24} />
          </button>

          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-transparent py-3 px-2 text-white placeholder-[#72767d] outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 text-[#b9bbbe] hover:text-white disabled:opacity-50"
          >
            <Send size={24} />
          </button>
        </div>
      </form>
    </div>
  );
}
