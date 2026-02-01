import React, { useState } from 'react';
import { Wifi, WifiOff, Users, Zap } from 'lucide-react';

interface LoginScreenProps {
  onConnect: (username: string, serverAddress: string) => void;
  isConnecting: boolean;
  error?: string;
}

export function LoginScreen({ onConnect, isConnecting, error }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [serverIP, setServerIP] = useState('');
  const [isHost, setIsHost] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const address = isHost
      ? 'ws://localhost:3333'
      : `ws://${serverIP}:3333`;

    onConnect(username.trim(), address);
  };

  return (
    <div className="min-h-screen bg-[#36393f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-[#5865f2] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Users size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">LANChat</h1>
          <p className="text-[#8e9297]">Chat de voz ligero para jugar en LAN</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#2f3136] rounded-lg p-3 text-center">
            <Wifi size={24} className="text-[#43b581] mx-auto mb-2" />
            <span className="text-xs text-[#8e9297]">Solo LAN</span>
          </div>
          <div className="bg-[#2f3136] rounded-lg p-3 text-center">
            <Zap size={24} className="text-[#faa61a] mx-auto mb-2" />
            <span className="text-xs text-[#8e9297]">Ultra rapido</span>
          </div>
          <div className="bg-[#2f3136] rounded-lg p-3 text-center">
            <WifiOff size={24} className="text-[#5865f2] mx-auto mb-2" />
            <span className="text-xs text-[#8e9297]">Sin internet</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#2f3136] rounded-lg p-6 shadow-xl">
          {/* Username */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#8e9297] uppercase mb-2">
              Tu nombre
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Player1"
              className="w-full bg-[#202225] text-white rounded px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#5865f2] placeholder-[#72767d]"
              maxLength={20}
            />
          </div>

          {/* Host/Join toggle */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#8e9297] uppercase mb-2">
              Modo de conexion
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsHost(true)}
                className={`py-3 rounded font-medium transition-colors ${
                  isHost
                    ? 'bg-[#5865f2] text-white'
                    : 'bg-[#202225] text-[#8e9297] hover:text-white'
                }`}
              >
                Soy el Host
              </button>
              <button
                type="button"
                onClick={() => setIsHost(false)}
                className={`py-3 rounded font-medium transition-colors ${
                  !isHost
                    ? 'bg-[#5865f2] text-white'
                    : 'bg-[#202225] text-[#8e9297] hover:text-white'
                }`}
              >
                Unirme
              </button>
            </div>
          </div>

          {/* Server IP (solo si no es host) */}
          {!isHost && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#8e9297] uppercase mb-2">
                IP del servidor (tu hermano)
              </label>
              <input
                type="text"
                value={serverIP}
                onChange={(e) => setServerIP(e.target.value)}
                placeholder="Ej: 192.168.1.100"
                className="w-full bg-[#202225] text-white rounded px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#5865f2] placeholder-[#72767d] font-mono"
              />
            </div>
          )}

          {isHost && (
            <div className="mb-4 bg-[#202225] rounded p-3">
              <p className="text-[#8e9297] text-sm">
                <strong className="text-[#43b581]">Como Host:</strong> Tu hermano debera conectarse a tu IP local.
                Ejecuta el servidor y compartele la IP que aparece en la consola.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 bg-[#ed4245]/20 border border-[#ed4245] rounded p-3">
              <p className="text-[#ed4245] text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isConnecting || !username.trim() || (!isHost && !serverIP.trim())}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#4752c4]/50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition-colors"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Conectando...
              </span>
            ) : (
              isHost ? 'Iniciar como Host' : 'Conectar'
            )}
          </button>
        </form>

        {/* Instructions */}
        <div className="mt-6 text-center text-[#8e9297] text-xs">
          <p>Primero uno debe ejecutar el servidor (Host)</p>
          <p>Luego el otro se conecta con la IP del Host</p>
        </div>
      </div>
    </div>
  );
}
