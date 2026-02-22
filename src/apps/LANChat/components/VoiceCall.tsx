import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff, Volume2 } from 'lucide-react';
import { CallState } from '../hooks/useLANChat';

interface VoiceCallProps {
  callState: CallState;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  remoteAudioRef: React.RefObject<HTMLAudioElement>;
}

export function VoiceCall({
  callState,
  onAccept,
  onReject,
  onEnd,
  remoteAudioRef
}: VoiceCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Contador de duracion de llamada
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (callState.connected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.connected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implementar mute real del stream local
  };

  if (!callState.active) return null;

  // Llamada entrante
  if (callState.incoming && !callState.connected) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[#36393f] rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          {/* Animacion de llamada entrante */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#5865f2] flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {callState.peer?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-[#43b581] animate-ping opacity-30" />
            </div>
          </div>

          <div className="flex items-center justify-center mb-2">
            <PhoneIncoming size={20} className="text-[#43b581] mr-2 animate-pulse" />
            <span className="text-[#43b581] text-sm font-medium">Llamada entrante</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-8">
            {callState.peer?.username}
          </h2>

          {/* Botones */}
          <div className="flex justify-center gap-8">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-[#ed4245] hover:bg-[#c73e40] flex items-center justify-center transition-colors shadow-lg"
            >
              <PhoneOff size={28} className="text-white" />
            </button>

            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-[#43b581] hover:bg-[#3ca374] flex items-center justify-center transition-colors shadow-lg animate-pulse"
            >
              <Phone size={28} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Llamada saliente (esperando respuesta)
  if (callState.outgoing && !callState.connected) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-[#36393f] rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-[#5865f2] flex items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {callState.peer?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-4 border-[#5865f2] animate-ping opacity-20" />
            </div>
          </div>

          <p className="text-[#8e9297] text-sm mb-2">Llamando a</p>
          <h2 className="text-2xl font-bold text-white mb-2">{callState.peer?.username}</h2>
          <p className="text-[#8e9297] text-sm mb-8 flex items-center justify-center">
            <span className="flex space-x-1 mr-2">
              <span className="w-2 h-2 bg-[#8e9297] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#8e9297] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="w-2 h-2 bg-[#8e9297] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </span>
            Esperando respuesta
          </p>

          <button
            onClick={onEnd}
            className="w-16 h-16 mx-auto rounded-full bg-[#ed4245] hover:bg-[#c73e40] flex items-center justify-center transition-colors shadow-lg"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Llamada conectada
  if (callState.connected) {
    return (
      <div className="fixed top-4 right-4 bg-[#36393f] rounded-xl p-4 shadow-2xl z-50 border border-[#202225]">
        {/* Audio remoto */}
        <audio ref={remoteAudioRef} autoPlay />

        <div className="flex items-center mb-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center mr-3">
            <span className="text-xl font-bold text-white">
              {callState.peer?.username.charAt(0).toUpperCase()}
            </span>
          </div>

          <div>
            <h3 className="text-white font-medium">{callState.peer?.username}</h3>
            <div className="flex items-center text-[#43b581] text-sm">
              <Volume2 size={14} className="mr-1 animate-pulse" />
              <span>{formatDuration(callDuration)}</span>
            </div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex justify-center gap-3">
          <button
            onClick={toggleMute}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-[#ed4245] hover:bg-[#c73e40]'
                : 'bg-[#4f545c] hover:bg-[#5d6269]'
            }`}
          >
            {isMuted ? (
              <MicOff size={18} className="text-white" />
            ) : (
              <Mic size={18} className="text-white" />
            )}
          </button>

          <button
            onClick={onEnd}
            className="w-10 h-10 rounded-full bg-[#ed4245] hover:bg-[#c73e40] flex items-center justify-center transition-colors"
          >
            <PhoneOff size={18} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
