"""Monitor de red: detecta nuevos listeners via netstat -ano."""

from __future__ import annotations

import asyncio

from ..core.events import SecurityEvent
from .base import BaseMonitor


class NetworkMonitor(BaseMonitor):
    """Monitorea conexiones de red buscando nuevos listeners.

    Usa `netstat -ano` para obtener conexiones TCP/UDP.
    Mantiene un set de listeners conocidos y alerta cuando aparecen nuevos.
    """

    # Puertos efímeros (49152-65535) son asignados dinámicamente por el OS.
    # No alertar por ellos — son conexiones temporales normales.
    EPHEMERAL_PORT_START = 49152

    def __init__(self, interval: int = 15, trusted_processes: list[str] | None = None,
                 ignored_ports: set[int] | None = None, ignore_ephemeral: bool = True):
        super().__init__("network", interval)
        self._known_listeners: set[tuple[str, int, int]] = set()  # (proto, port, pid)
        self._trusted = set(p.lower() for p in (trusted_processes or []))
        self._ignored_ports = ignored_ports or set()
        self._ignore_ephemeral = ignore_ephemeral
        self._pid_cache: dict[int, str] = {}

    async def setup(self) -> None:
        """Captura el estado inicial de listeners para no alertar al inicio."""
        listeners = await self._get_listeners()
        self._known_listeners = {(l["proto"], l["local_port"], l["pid"]) for l in listeners}
        await self._refresh_pid_cache()
        self.log.info("Baseline: %d listeners conocidos", len(self._known_listeners))

    async def poll(self) -> list[SecurityEvent]:
        """Detecta nuevos listeners comparando con el baseline."""
        events = []
        listeners = await self._get_listeners()
        await self._refresh_pid_cache()

        current = set()
        for l in listeners:
            key = (l["proto"], l["local_port"], l["pid"])
            current.add(key)

            if key not in self._known_listeners:
                if l["local_port"] in self._ignored_ports:
                    self._known_listeners.add(key)
                    continue
                # Saltar puertos efímeros (asignados por el OS, no son servicios reales)
                if self._ignore_ephemeral and l["local_port"] >= self.EPHEMERAL_PORT_START:
                    self._known_listeners.add(key)
                    continue
                process = self._pid_cache.get(l["pid"], "unknown")
                is_trusted = process.lower() in self._trusted

                events.append(SecurityEvent(
                    source="network",
                    event_type="new_listener",
                    data={
                        "proto": l["proto"],
                        "local_addr": l["local_addr"],
                        "local_port": l["local_port"],
                        "pid": l["pid"],
                        "process": process,
                        "state": "LISTENING",
                        "trusted": is_trusted,
                    },
                ))

        self._known_listeners = current
        return events

    def get_state(self) -> dict:
        """Retorna listeners actuales para el dashboard."""
        listeners = []
        for proto, port, pid in self._known_listeners:
            process = self._pid_cache.get(pid, "unknown")
            listeners.append({
                "proto": proto,
                "local_port": port,
                "pid": pid,
                "process": process,
                "trusted": process.lower() in self._trusted,
            })
        return {
            "listeners": sorted(listeners, key=lambda x: x["local_port"]),
            "total": len(listeners),
        }

    async def _get_listeners(self) -> list[dict]:
        """Ejecuta netstat -ano y parsea los listeners."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "netstat", "-ano",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
            output = stdout.decode("utf-8", errors="replace")
            return self._parse_netstat(output)
        except Exception as e:
            self.log.error("Error ejecutando netstat: %s", e)
            return []

    def _parse_netstat(self, output: str) -> list[dict]:
        """Parsea la salida de netstat -ano extrayendo listeners (LISTENING).

        Formato típico de netstat -ano:
          Proto  Local Address          Foreign Address        State           PID
          TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1234
          TCP    [::]:445               [::]:0                 LISTENING       4
          UDP    0.0.0.0:5353           *:*                                    5678

        Para TCP, filtra solo LISTENING.
        Para UDP, incluye todas (UDP no tiene estado LISTENING formal).
        Retorna lista de dicts con proto, local_addr, local_port, pid.
        """
        listeners = []
        for line in output.splitlines():
            parts = line.split()
            if len(parts) < 4:
                continue

            proto = parts[0].upper()
            if proto not in ("TCP", "UDP"):
                continue

            # TCP necesita estado LISTENING
            if proto == "TCP":
                if len(parts) < 5 or parts[3] != "LISTENING":
                    continue
                pid_str = parts[4]
            else:
                # UDP: el PID es el último campo
                pid_str = parts[-1]

            # Parsear local address
            local = parts[1]
            if "]:" in local:
                # IPv6: [::]:port
                addr, port_str = local.rsplit(":", 1)
            else:
                addr, port_str = local.rsplit(":", 1)

            try:
                port = int(port_str)
                pid = int(pid_str)
            except ValueError:
                continue

            listeners.append({
                "proto": proto,
                "local_addr": addr,
                "local_port": port,
                "pid": pid,
            })

        return listeners

    async def _refresh_pid_cache(self) -> None:
        """Actualiza el cache PID -> nombre de proceso via tasklist."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "tasklist", "/FO", "CSV", "/NH",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
            output = stdout.decode("utf-8", errors="replace")

            self._pid_cache.clear()
            for line in output.splitlines():
                line = line.strip().strip('"')
                if not line:
                    continue
                parts = line.split('","')
                if len(parts) >= 2:
                    name = parts[0].strip('"')
                    try:
                        pid = int(parts[1].strip('"'))
                        self._pid_cache[pid] = name
                    except ValueError:
                        continue
        except Exception as e:
            self.log.debug("Error actualizando PID cache: %s", e)
