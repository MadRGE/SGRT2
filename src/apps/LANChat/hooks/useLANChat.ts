import { useState, useEffect, useRef, useCallback } from 'react';

export interface User {
  id: number;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  joinedAt?: number;
}

export interface Message {
  id: number;
  from: User;
  content: string;
  timestamp: string;
}

export interface LANChatState {
  connected: boolean;
  userId: number | null;
  username: string;
  users: User[];
  messages: Message[];
  serverIP: string;
  typingUsers: User[];
}

export interface CallState {
  active: boolean;
  callId: string | null;
  peer: User | null;
  incoming: boolean;
  outgoing: boolean;
  connected: boolean;
}

export function useLANChat(serverAddress: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<LANChatState>({
    connected: false,
    userId: null,
    username: '',
    users: [],
    messages: [],
    serverIP: '',
    typingUsers: []
  });

  const [callState, setCallState] = useState<CallState>({
    active: false,
    callId: null,
    peer: null,
    incoming: false,
    outgoing: false,
    connected: false
  });

  // WebRTC para llamadas de voz
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const connect = useCallback((username: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(serverAddress);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', username }));
      setState(prev => ({ ...prev, connected: true, username }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'welcome':
          setState(prev => ({
            ...prev,
            userId: data.id,
            serverIP: data.serverIP,
            messages: data.messages || []
          }));
          break;

        case 'users':
          setState(prev => ({ ...prev, users: data.users }));
          break;

        case 'message':
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, data.message].slice(-100)
          }));
          break;

        case 'user_joined':
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: Date.now(),
              from: { id: 0, username: 'Sistema', status: 'online' as const },
              content: `${data.user.username} se unio al chat`,
              timestamp: new Date().toISOString()
            }]
          }));
          break;

        case 'user_left':
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, {
              id: Date.now(),
              from: { id: 0, username: 'Sistema', status: 'online' as const },
              content: `${data.username} salio del chat`,
              timestamp: new Date().toISOString()
            }]
          }));
          break;

        case 'typing':
          setState(prev => {
            const exists = prev.typingUsers.find(u => u.id === data.user.id);
            if (!exists) {
              setTimeout(() => {
                setState(p => ({
                  ...p,
                  typingUsers: p.typingUsers.filter(u => u.id !== data.user.id)
                }));
              }, 2000);
              return { ...prev, typingUsers: [...prev.typingUsers, data.user] };
            }
            return prev;
          });
          break;

        case 'call_incoming':
          setCallState({
            active: true,
            callId: data.callId,
            peer: data.from,
            incoming: true,
            outgoing: false,
            connected: false
          });
          break;

        case 'call_accepted':
          setCallState(prev => ({ ...prev, connected: true, incoming: false }));
          // Iniciar conexion WebRTC
          initializeWebRTC(data.callId, true);
          break;

        case 'call_rejected':
          setCallState({
            active: false,
            callId: null,
            peer: null,
            incoming: false,
            outgoing: false,
            connected: false
          });
          break;

        case 'call_ended':
          endCall();
          break;

        case 'webrtc_signal':
          handleWebRTCSignal(data.signal, data.from);
          break;
      }
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, connected: false }));
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }, [serverAddress]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState({
      connected: false,
      userId: null,
      username: '',
      users: [],
      messages: [],
      serverIP: '',
      typingUsers: []
    });
  }, []);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || !content.trim()) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content: content.trim() }));
  }, []);

  const sendTyping = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'typing' }));
  }, []);

  // Funciones de llamada de voz
  const startCall = useCallback(async (targetUser: User) => {
    const callId = `call_${Date.now()}`;
    setCallState({
      active: true,
      callId,
      peer: targetUser,
      incoming: false,
      outgoing: true,
      connected: false
    });

    wsRef.current?.send(JSON.stringify({
      type: 'call_request',
      targetId: targetUser.id,
      callId
    }));
  }, []);

  const acceptCall = useCallback(async () => {
    if (!callState.callId || !callState.peer) return;

    wsRef.current?.send(JSON.stringify({
      type: 'call_accept',
      callerId: callState.peer.id,
      callId: callState.callId
    }));

    setCallState(prev => ({ ...prev, incoming: false, connected: true }));
    await initializeWebRTC(callState.callId, false);
  }, [callState]);

  const rejectCall = useCallback(() => {
    if (!callState.peer) return;

    wsRef.current?.send(JSON.stringify({
      type: 'call_reject',
      callerId: callState.peer.id,
      callId: callState.callId
    }));

    setCallState({
      active: false,
      callId: null,
      peer: null,
      incoming: false,
      outgoing: false,
      connected: false
    });
  }, [callState]);

  const endCall = useCallback(() => {
    // Limpiar WebRTC
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (callState.callId) {
      wsRef.current?.send(JSON.stringify({
        type: 'call_end',
        callId: callState.callId
      }));
    }

    setCallState({
      active: false,
      callId: null,
      peer: null,
      incoming: false,
      outgoing: false,
      connected: false
    });
  }, [callState.callId]);

  const initializeWebRTC = async (callId: string, isInitiator: boolean) => {
    try {
      // Configuracion optimizada para bajo ancho de banda
      const config: RTCConfiguration = {
        iceServers: [] // Solo LAN, no necesitamos STUN/TURN
      };

      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      // Obtener audio con configuracion optimizada
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Bajo bitrate para ahorrar ancho de banda
          sampleRate: 16000,
          channelCount: 1
        },
        video: false
      });

      localStreamRef.current = stream;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(console.error);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const targetId = callState.peer?.id;
          if (targetId) {
            wsRef.current?.send(JSON.stringify({
              type: 'webrtc_signal',
              targetId,
              callId,
              signal: { type: 'candidate', candidate: event.candidate }
            }));
          }
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const targetId = callState.peer?.id;
        if (targetId) {
          wsRef.current?.send(JSON.stringify({
            type: 'webrtc_signal',
            targetId,
            callId,
            signal: { type: 'offer', sdp: offer }
          }));
        }
      }
    } catch (err) {
      console.error('Error inicializando WebRTC:', err);
      endCall();
    }
  };

  const handleWebRTCSignal = async (signal: any, fromId: number) => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        wsRef.current?.send(JSON.stringify({
          type: 'webrtc_signal',
          targetId: fromId,
          callId: callState.callId,
          signal: { type: 'answer', sdp: answer }
        }));
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'candidate' && signal.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.error('Error manejando senal WebRTC:', err);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return {
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
  };
}
