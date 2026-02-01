import React, { useState, useRef } from 'react';
import { useLANChat } from './hooks/useLANChat';
import { LoginScreen } from './components/LoginScreen';
import { UserList } from './components/UserList';
import { ChatArea } from './components/ChatArea';
import { VoiceCall } from './components/VoiceCall';
import { LogOut, Settings, Wifi } from 'lucide-react';

export function LANChatApp() {
  const [serverAddress, setServerAddress] = useState('');
  const [connectionError, setConnectionError] = useState<string>();
  const [isConnecting, setIsConnecting] = useState(false);

  const {
    state,
    callState,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    remoteAudioRef
  } = useLANChat(serverAddress);

  const handleConnect = async (username: string, address: string) => {
    setServerAddress(address);
    setIsConnecting(true);
    setConnectionError(undefined);

    try {
      // Esperar un poco para que el WebSocket se configure
      await new Promise(resolve => setTimeout(resolve, 100));
      connect(username);

      // Timeout de conexion
      setTimeout(() => {
        if (!state.connected) {
          setConnectionError('No se pudo conectar. Verifica que el servidor este corriendo.');
          setIsConnecting(false);
        }
      }, 5000);
    } catch (err) {
      setConnectionError('Error al conectar. Verifica la IP del servidor.');
      setIsConnecting(false);
    }
  };

  // Si el WebSocket se conecta, quitar el estado de "conectando"
  React.useEffect(() => {
    if (state.connected) {
      setIsConnecting(false);
      setConnectionError(undefined);
    }
  }, [state.connected]);

  // Pantalla de login
  if (!state.connected && !isConnecting) {
    return (
      <LoginScreen
        onConnect={handleConnect}
        isConnecting={isConnecting}
        error={connectionError}
      />
    );
  }

  // Pantalla de carga
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-[#36393f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#5865f2] flex items-center justify-center animate-pulse">
            <Wifi size={32} className="text-white" />
          </div>
          <p className="text-white font-medium">Conectando al servidor...</p>
          <p className="text-[#8e9297] text-sm mt-2">{serverAddress}</p>
        </div>
      </div>
    );
  }

  // App principal
  return (
    <div className="h-screen flex bg-[#202225] overflow-hidden">
      {/* Sidebar de servidores (minimalista) */}
      <div className="w-[72px] bg-[#202225] flex flex-col items-center py-3">
        {/* Logo/Home */}
        <div className="w-12 h-12 rounded-2xl bg-[#5865f2] flex items-center justify-center mb-2 cursor-pointer hover:rounded-xl transition-all">
          <span className="text-white font-bold text-xl">LC</span>
        </div>

        <div className="w-8 h-0.5 bg-[#36393f] rounded-full mb-2" />

        {/* Server activo */}
        <div className="relative group">
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-full" />
          <div className="w-12 h-12 rounded-2xl bg-[#36393f] flex items-center justify-center cursor-pointer">
            <Wifi size={24} className="text-[#43b581]" />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desconectar */}
        <button
          onClick={disconnect}
          className="w-12 h-12 rounded-full bg-[#36393f] hover:bg-[#ed4245] flex items-center justify-center text-[#ed4245] hover:text-white transition-colors group"
          title="Desconectar"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Lista de usuarios */}
      <UserList
        users={state.users}
        currentUserId={state.userId}
        onCallUser={startCall}
      />

      {/* Area de chat */}
      <ChatArea
        messages={state.messages}
        typingUsers={state.typingUsers}
        currentUserId={state.userId}
        onSendMessage={sendMessage}
        onTyping={sendTyping}
      />

      {/* Modal/Widget de llamada */}
      <VoiceCall
        callState={callState}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        remoteAudioRef={remoteAudioRef as React.RefObject<HTMLAudioElement>}
      />

      {/* Info de conexion (esquina inferior) */}
      <div className="fixed bottom-4 left-20 bg-[#18191c] rounded-lg px-3 py-2 text-xs text-[#8e9297] flex items-center gap-2 shadow-lg">
        <div className="w-2 h-2 rounded-full bg-[#43b581] animate-pulse" />
        <span>Conectado a {state.serverIP}</span>
      </div>
    </div>
  );
}

export default LANChatApp;
