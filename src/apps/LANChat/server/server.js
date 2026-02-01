/**
 * LANChat Server - Servidor de mensajería LAN estilo Discord
 * Ejecutar con: node server.js
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = 3333;

// Obtener IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_IP = getLocalIP();

// Almacenamiento en memoria
const users = new Map(); // socketId -> { username, id, status }
const messages = []; // Historial de mensajes
const MAX_MESSAGES = 100;

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ip: LOCAL_IP,
      port: PORT,
      users: Array.from(users.values()),
      online: users.size
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>LANChat Server</title></head>
      <body style="font-family: Arial; background: #36393f; color: white; padding: 40px;">
        <h1>LANChat Server Running</h1>
        <p>IP: <strong>${LOCAL_IP}</strong></p>
        <p>Puerto: <strong>${PORT}</strong></p>
        <p>Usuarios conectados: <strong>${users.size}</strong></p>
        <hr>
        <p>Conecta desde tu aplicacion a: <code>ws://${LOCAL_IP}:${PORT}</code></p>
      </body>
    </html>
  `);
});

// Crear WebSocket Server
const wss = new WebSocketServer({ server });

let idCounter = 0;

function broadcast(message, excludeId = null) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.userId !== excludeId) {
      client.send(data);
    }
  });
}

function broadcastUserList() {
  broadcast({
    type: 'users',
    users: Array.from(users.values())
  });
}

wss.on('connection', (ws) => {
  const id = ++idCounter;
  ws.userId = id;

  console.log(`[+] Nueva conexion: #${id}`);

  // Enviar ID y configuracion inicial
  ws.send(JSON.stringify({
    type: 'welcome',
    id: id,
    serverIP: LOCAL_IP,
    messages: messages.slice(-50) // Ultimos 50 mensajes
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'join':
          // Usuario se une
          users.set(id, {
            id: id,
            username: msg.username || `Usuario${id}`,
            status: 'online',
            joinedAt: Date.now()
          });
          console.log(`[JOIN] ${msg.username} se unio`);

          broadcast({
            type: 'user_joined',
            user: users.get(id)
          });
          broadcastUserList();
          break;

        case 'message':
          // Mensaje de chat
          const chatMsg = {
            id: Date.now(),
            from: users.get(id),
            content: msg.content,
            timestamp: new Date().toISOString()
          };
          messages.push(chatMsg);
          if (messages.length > MAX_MESSAGES) {
            messages.shift();
          }

          broadcast({
            type: 'message',
            message: chatMsg
          });
          console.log(`[MSG] ${users.get(id)?.username}: ${msg.content}`);
          break;

        case 'call_request':
          // Solicitud de llamada
          const targetUser = Array.from(users.entries()).find(([, u]) => u.id === msg.targetId);
          if (targetUser) {
            const targetWs = Array.from(wss.clients).find(c => c.userId === msg.targetId);
            if (targetWs) {
              targetWs.send(JSON.stringify({
                type: 'call_incoming',
                from: users.get(id),
                callId: msg.callId
              }));
            }
          }
          break;

        case 'call_accept':
          // Aceptar llamada
          const callerWs = Array.from(wss.clients).find(c => c.userId === msg.callerId);
          if (callerWs) {
            callerWs.send(JSON.stringify({
              type: 'call_accepted',
              by: users.get(id),
              callId: msg.callId
            }));
          }
          break;

        case 'call_reject':
          // Rechazar llamada
          const caller = Array.from(wss.clients).find(c => c.userId === msg.callerId);
          if (caller) {
            caller.send(JSON.stringify({
              type: 'call_rejected',
              by: users.get(id),
              callId: msg.callId
            }));
          }
          break;

        case 'call_end':
          // Terminar llamada
          broadcast({
            type: 'call_ended',
            callId: msg.callId,
            by: users.get(id)
          });
          break;

        case 'webrtc_signal':
          // Señalizacion WebRTC
          const peerWs = Array.from(wss.clients).find(c => c.userId === msg.targetId);
          if (peerWs) {
            peerWs.send(JSON.stringify({
              type: 'webrtc_signal',
              from: id,
              signal: msg.signal,
              callId: msg.callId
            }));
          }
          break;

        case 'typing':
          // Indicador de escritura
          broadcast({
            type: 'typing',
            user: users.get(id)
          }, id);
          break;

        case 'status':
          // Cambio de estado
          if (users.has(id)) {
            users.get(id).status = msg.status;
            broadcastUserList();
          }
          break;
      }
    } catch (err) {
      console.error('Error procesando mensaje:', err);
    }
  });

  ws.on('close', () => {
    const user = users.get(id);
    if (user) {
      console.log(`[-] ${user.username} se desconecto`);
      users.delete(id);
      broadcast({
        type: 'user_left',
        userId: id,
        username: user.username
      });
      broadcastUserList();
    }
  });

  ws.on('error', (err) => {
    console.error(`Error en conexion #${id}:`, err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║         LANChat Server v1.0                ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║  IP Local:    ${LOCAL_IP.padEnd(26)} ║`);
  console.log(`║  Puerto:      ${String(PORT).padEnd(26)} ║`);
  console.log(`║  WebSocket:   ws://${LOCAL_IP}:${PORT}`.padEnd(45) + '║');
  console.log('╠════════════════════════════════════════════╣');
  console.log('║  Comparte esta IP con tu hermano para      ║');
  console.log('║  que se conecte desde su computadora.      ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
});
