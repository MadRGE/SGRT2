"use client";

import { useState } from "react";
import { Scale, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [tab, setTab] = useState<"gestor" | "cliente">("gestor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, type: tab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.studio) localStorage.setItem("studio", JSON.stringify(data.studio));
      if (data.cliente) localStorage.setItem("cliente", JSON.stringify(data.cliente));

      window.location.href = tab === "gestor" ? "/inicio" : "/portal/gestiones";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-regulatorio flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4">
            <Scale className="w-8 h-8 text-regulatorio" />
          </div>
          <h1 className="text-2xl font-bold text-white">SGRT</h1>
          <p className="text-text-sidebar text-sm mt-1">Sistema de Gestión de Trámites Regulatorios</p>
        </div>

        <div className="bg-bg-card rounded-xl shadow-xl p-6">
          <div className="flex bg-bg-hover rounded-lg p-1 mb-6">
            <button
              onClick={() => setTab("gestor")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                tab === "gestor" ? "bg-regulatorio text-white shadow" : "text-text-secondary"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Gestor
            </button>
            <button
              onClick={() => setTab("cliente")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${
                tab === "cliente" ? "bg-regulatorio text-white shadow" : "text-text-secondary"
              }`}
            >
              <User className="w-4 h-4" />
              Soy Cliente
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-regulatorio focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-regulatorio focus:border-transparent outline-none"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-regulatorio font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
