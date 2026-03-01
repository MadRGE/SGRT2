"""Dashboard web: servidor aiohttp con HTTP + WebSocket."""

from __future__ import annotations

import asyncio
import json
from collections import deque
from pathlib import Path

from aiohttp import web

from ..core.events import Alert, SecurityEvent
from ..core.logger import get_logger

log = get_logger("dashboard")

_STATIC_DIR = Path(__file__).parent / "static"
_MAX_RECENT_EVENTS = 100
_MAX_RECENT_ALERTS = 50
_STATS_INTERVAL = 5


class DashboardServer:
    def __init__(self, host: str, port: int, engine):
        self.host = host
        self.port = port
        self.engine = engine

        self._app = web.Application()
        self._runner: web.AppRunner | None = None
        self._ws_clients: set[web.WebSocketResponse] = set()

        self._recent_events: deque[dict] = deque(maxlen=_MAX_RECENT_EVENTS)
        self._recent_alerts: deque[dict] = deque(maxlen=_MAX_RECENT_ALERTS)

        self._app.router.add_get("/ws", self._ws_handler)
        self._app.router.add_get("/", self._index_handler)

    async def start(self) -> None:
        """Inicia el servidor HTTP y el loop de stats periódico."""
        self._runner = web.AppRunner(self._app)
        await self._runner.setup()
        site = web.TCPSite(self._runner, self.host, self.port)
        await site.start()
        log.info("Dashboard en http://%s:%d", self.host, self.port)

        # Loop de stats periódico
        while True:
            await asyncio.sleep(_STATS_INTERVAL)
            await self._broadcast_stats()

    async def stop(self) -> None:
        """Cierra conexiones WS y para el servidor."""
        for ws in set(self._ws_clients):
            await ws.close()
        self._ws_clients.clear()
        if self._runner:
            await self._runner.cleanup()

    async def _index_handler(self, request: web.Request) -> web.FileResponse:
        return web.FileResponse(_STATIC_DIR / "index.html")

    async def _ws_handler(self, request: web.Request) -> web.WebSocketResponse:
        ws = web.WebSocketResponse(heartbeat=30)
        await ws.prepare(request)
        self._ws_clients.add(ws)
        log.info("WS cliente conectado (%d total)", len(self._ws_clients))

        # Snapshot inicial
        snapshot = self.engine.get_snapshot()
        snapshot["recent_alerts"] = list(self._recent_alerts)
        snapshot["recent_events"] = list(self._recent_events)
        await ws.send_json({"type": "snapshot", "data": snapshot})

        try:
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    if data.get("type") == "ping":
                        await ws.send_json({"type": "pong"})
                elif msg.type == web.WSMsgType.ERROR:
                    break
        finally:
            self._ws_clients.discard(ws)
            log.info("WS cliente desconectado (%d restantes)", len(self._ws_clients))

        return ws

    def broadcast_event(self, event: SecurityEvent) -> None:
        """Pushea evento a todos los clientes WS (fire-and-forget)."""
        event_dict = {
            "source": event.source,
            "event_type": event.event_type,
            "data": event.data,
            "timestamp": event.timestamp.isoformat(),
            "event_id": event.event_id,
        }
        self._recent_events.append(event_dict)
        msg = json.dumps({"type": "event", "data": event_dict})
        self._broadcast_raw(msg)

        # Si es evento de red, mandar update completo de listeners
        if event.source == "network":
            self._broadcast_listeners_update()

    def broadcast_alert(self, alert: Alert) -> None:
        """Pushea alerta a todos los clientes WS (fire-and-forget)."""
        alert_dict = alert.to_dict()
        self._recent_alerts.append(alert_dict)
        msg = json.dumps({"type": "alert", "data": alert_dict})
        self._broadcast_raw(msg)

    def _broadcast_listeners_update(self) -> None:
        """Manda estado actual de listeners desde el network monitor."""
        for monitor in self.engine.monitors:
            if monitor.name == "network":
                state = monitor.get_state()
                msg = json.dumps({"type": "listeners_update", "data": state})
                self._broadcast_raw(msg)
                break

    def _broadcast_raw(self, msg: str) -> None:
        """Envía JSON string a todos los clientes WS conectados."""
        dead = []
        for ws in self._ws_clients:
            if ws.closed:
                dead.append(ws)
            else:
                asyncio.ensure_future(ws.send_str(msg))
        for ws in dead:
            self._ws_clients.discard(ws)

    async def _broadcast_stats(self) -> None:
        """Update periódico de stats a todos los clientes."""
        if not self._ws_clients:
            return
        stats = {
            "events_total": self.engine._event_count,
            "alerts_total": self.engine._alert_count,
            "ws_clients": len(self._ws_clients),
        }
        if hasattr(self.engine, "_start_time"):
            from datetime import datetime
            stats["uptime_seconds"] = (datetime.now() - self.engine._start_time).total_seconds()

        # También mandar listeners actualizados
        for monitor in self.engine.monitors:
            if monitor.name == "network":
                stats["listeners"] = monitor.get_state()
                break

        msg = json.dumps({"type": "stats", "data": stats})
        self._broadcast_raw(msg)
