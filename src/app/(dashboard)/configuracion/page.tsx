"use client";

import { useEffect, useState } from "react";
import { Settings, User, Building2, Key, Shield } from "lucide-react";

export default function ConfiguracionPage() {
  const [user, setUser] = useState<{ nombre: string; email: string; role: string } | null>(null);
  const [studio, setStudio] = useState<{ nombre: string } | null>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      const s = JSON.parse(localStorage.getItem("studio") || "null");
      setUser(u);
      setStudio(s);
    } catch {}
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-regulatorio" />
        <h1 className="text-xl font-bold">Configuración</h1>
      </div>

      <div className="space-y-4">
        {/* Studio info */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-regulatorio" />
            <h2 className="font-semibold text-sm">Estudio</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-xs text-text-secondary">Nombre</span><p>{studio?.nombre || "—"}</p></div>
          </div>
        </div>

        {/* User info */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-regulatorio" />
            <h2 className="font-semibold text-sm">Usuario</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-xs text-text-secondary">Nombre</span><p>{user?.nombre || "—"}</p></div>
            <div><span className="text-xs text-text-secondary">Email</span><p>{user?.email || "—"}</p></div>
            <div><span className="text-xs text-text-secondary">Rol</span><p className="capitalize">{user?.role || "—"}</p></div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-regulatorio" />
            <h2 className="font-semibold text-sm">API Keys</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-bg-hover rounded-lg">
              <div><p className="font-medium">Claude API Key</p><p className="text-xs text-text-secondary">Para el Asistente IA</p></div>
              <span className="text-xs text-text-secondary">No configurada</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg-hover rounded-lg">
              <div><p className="font-medium">Mckein API</p><p className="text-xs text-text-secondary">Sincronización con la red</p></div>
              <span className="text-xs text-text-secondary">No configurada</span>
            </div>
          </div>
        </div>

        {/* Integraciones */}
        <div className="bg-bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-regulatorio" />
            <h2 className="font-semibold text-sm">Integraciones</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-bg-hover rounded-lg">
              <div><p className="font-medium">Hammer Agent</p><p className="text-xs text-text-secondary">Automatización CDP :18792</p></div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Offline</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-bg-hover rounded-lg">
              <div><p className="font-medium">Neon Database</p><p className="text-xs text-text-secondary">sgrt2 · wild-frog-57784632</p></div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">Conectada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
