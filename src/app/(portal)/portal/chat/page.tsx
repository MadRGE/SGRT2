"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send } from "lucide-react";

interface Mensaje { id: string; texto: string; origen: string; createdAt: string; user?: { nombre: string } | null }

export default function PortalChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function load() {
    const token = localStorage.getItem("token");
    fetch("/api/portal/mensajes", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then(setMensajes);
  }

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setSending(true);
    const token = localStorage.getItem("token");
    await fetch("/api/portal/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ texto }),
    });
    setTexto("");
    setSending(false);
    load();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-regulatorio" />
        <h1 className="text-lg font-bold">Chat con el Gestor</h1>
      </div>

      <div className="flex-1 overflow-y-auto bg-bg-card rounded-xl border border-border p-4 space-y-3">
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.origen === "cliente" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
              m.origen === "cliente" ? "bg-regulatorio text-white" : "bg-bg-hover text-text-primary"
            }`}>
              {m.origen === "staff" && m.user && (
                <p className="text-[10px] font-medium opacity-70 mb-0.5">{m.user.nombre}</p>
              )}
              <p>{m.texto}</p>
              <p className={`text-[10px] mt-1 ${m.origen === "cliente" ? "text-white/50" : "text-text-secondary"}`}>
                {new Date(m.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
        {mensajes.length === 0 && (
          <p className="text-center text-text-secondary text-sm py-8">Sin mensajes. Escribí para consultar sobre tus trámites.</p>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribí un mensaje..."
          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-regulatorio" />
        <button type="submit" disabled={sending || !texto.trim()}
          className="px-4 py-2.5 bg-regulatorio text-white rounded-lg hover:bg-regulatorio-light disabled:opacity-50 transition">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
