"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2 } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string }

const SYSTEM_PROMPT = `Sos un asistente experto en trámites regulatorios argentinos.
Conocés los organismos ANMAT, INAL, SENASA, INTI, SEDRONAR, CITES, ENACOM, SIC.
Ayudás al gestor con consultas sobre requisitos, documentación, plazos, aranceles y procedimientos.
Respondé en español, de forma concisa y práctica.`;

export default function AsistenteIAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // For now, simple echo response — replace with actual AI call when API key is configured
      const aiResponse = `[AI no configurada aún] Tu consulta: "${userMsg.content}"\n\nPara activar el asistente IA, configurá tu API key de Claude en /configuracion.`;
      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error al conectar con el asistente." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-3 mb-4">
        <Bot className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">Asistente IA</h1>
        <span className="text-sm text-text-secondary">Experto en trámites regulatorios</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-bg-card rounded-xl border border-border p-4 space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-regulatorio/20 mx-auto mb-3" />
            <p className="text-sm text-text-secondary">Preguntame sobre trámites, requisitos, documentación, plazos o aranceles.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {[
                "¿Qué documentos necesito para inscribir un RNPA?",
                "¿Cuánto tarda un registro ANMAT Clase II?",
                "¿Qué es el RNE y quién lo tramita?",
              ].map((q) => (
                <button key={q} onClick={() => setInput(q)}
                  className="px-3 py-1.5 bg-bg-hover rounded-lg text-xs text-text-secondary hover:bg-border transition">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-regulatorio text-white" : "bg-bg-hover text-text-primary"
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-bg-hover rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-regulatorio" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Preguntá sobre trámites regulatorios..."
          className="flex-1 px-4 py-3 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-5 py-3 bg-accent hover:bg-accent-hover text-regulatorio rounded-xl font-semibold disabled:opacity-50 transition">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
