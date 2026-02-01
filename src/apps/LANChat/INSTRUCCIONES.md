# LANChat - App de Chat/Voz para Jugar en LAN

App ultra liviana estilo Discord para comunicarte con tu hermano mientras juegan.
**No usa internet** - Solo funciona en red local (LAN).

## Ventajas sobre Discord/TeamSpeak

- **Cero lag**: Comunicacion directa sin servidores externos
- **Muy poco ancho de banda**: Audio optimizado a 16kHz mono
- **Sin cuenta**: No necesitas registrarte en nada
- **Privado**: Todo queda en tu red local

---

## Como Usarlo

### PASO 1: Instalar el servidor (una sola vez)

```bash
cd src/apps/LANChat/server
npm install
```

### PASO 2: Decidir quien es el HOST

Uno de los dos (tu o tu hermano) debe ser el **Host** (el que tiene el servidor).
Generalmente es mejor que sea el que tiene la PC mas potente o la IP mas estable.

### PASO 3: El HOST ejecuta el servidor

```bash
cd src/apps/LANChat/server
npm start
```

Veras algo como:

```
╔════════════════════════════════════════════╗
║         LANChat Server v1.0                ║
╠════════════════════════════════════════════╣
║  IP Local:    192.168.1.100                ║
║  Puerto:      3333                         ║
║  WebSocket:   ws://192.168.1.100:3333      ║
╠════════════════════════════════════════════╣
║  Comparte esta IP con tu hermano para      ║
║  que se conecte desde su computadora.      ║
╚════════════════════════════════════════════╝
```

**IMPORTANTE**: Anota la IP que aparece (ej: `192.168.1.100`)

### PASO 4: Abrir la app en el navegador

En el proyecto principal, ya puedes usar el componente LANChatApp.
O puedes crear un archivo HTML simple para probarlo.

### PASO 5: Conectarse

**El HOST:**
1. Elige "Soy el Host"
2. Escribe tu nombre
3. Click en "Iniciar como Host"

**Tu hermano:**
1. Elige "Unirme"
2. Escribe su nombre
3. Escribe la IP del Host (ej: `192.168.1.100`)
4. Click en "Conectar"

---

## Funciones

### Chat de Texto
- Escribe mensajes en tiempo real
- Historial de los ultimos 100 mensajes
- Indicador de "escribiendo..."

### Llamadas de Voz
- Click en el icono de telefono junto al nombre de tu hermano
- El acepta la llamada
- Hablan con audio en tiempo real
- Ultra bajo consumo de datos (audio 16kHz mono)

---

## Solucion de Problemas

### "No puedo conectarme"
1. Verifica que el servidor este corriendo
2. Verifica que escribiste bien la IP
3. Asegurate de estar en la misma red WiFi/LAN
4. Desactiva temporalmente el firewall de Windows

### "No escucho audio en las llamadas"
1. Permite el acceso al microfono en el navegador
2. Verifica que el microfono funcione
3. Usa Chrome o Firefox (Safari puede tener problemas)

### "El servidor no muestra mi IP"
Ejecuta en la terminal:
- Windows: `ipconfig`
- Linux/Mac: `ifconfig` o `ip addr`

Busca la direccion IPv4 de tu adaptador de red (ej: 192.168.x.x)

---

## Requisitos

- Node.js 16+
- Navegador moderno (Chrome, Firefox, Edge)
- Estar en la misma red LAN

---

## Arquitectura

```
┌─────────────────┐         ┌─────────────────┐
│   Tu PC         │         │  PC Hermano     │
│  (Host)         │         │                 │
│                 │         │                 │
│  ┌───────────┐  │  LAN    │  ┌───────────┐  │
│  │ Servidor  │◄─┼────────►┼──│ Cliente   │  │
│  │ Node.js   │  │         │  │ React     │  │
│  └───────────┘  │         │  └───────────┘  │
│       ▲         │         │                 │
│       │         │         │                 │
│  ┌────┴────┐    │         │                 │
│  │ Cliente │    │         │                 │
│  │ React   │    │         │                 │
│  └─────────┘    │         │                 │
└─────────────────┘         └─────────────────┘

Comunicacion:
- WebSocket: Chat de texto + senalizacion
- WebRTC: Audio P2P directo (sin pasar por servidor)
```

---

## Consumo de Ancho de Banda

| Funcion       | Consumo aprox.     |
|---------------|--------------------|
| Chat texto    | < 1 KB/mensaje     |
| Voz activa    | ~32 Kbps (4 KB/s)  |
| Voz inactiva  | ~0 (VAD)           |

**Comparacion con Discord**: Discord usa ~64-96 Kbps para voz.
LANChat usa la mitad y ademas va directo por LAN.
