"""Detector de port scan con sliding window."""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict

from ..core.events import SecurityEvent
from .base import BaseMonitor


class PortScanDetector(BaseMonitor):
    """Detecta port scans analizando conexiones entrantes con sliding window.

    Mantiene un registro de IPs remotas y los puertos que contactan.
    Si una IP contacta más de `threshold` puertos distintos dentro de
    `window` segundos, genera una alerta SCAN001.
    """

    def __init__(self, interval: int = 10, threshold: int = 10, window: int = 120):
        super().__init__("portscan", interval)
        self.threshold = threshold
        self.window = window
        # {remote_ip: [(timestamp, local_port), ...]}
        self._connections: dict[str, list[tuple[float, int]]] = defaultdict(list)
        self._alerted_ips: set[str] = set()  # IPs ya alertadas en esta ventana

    async def poll(self) -> list[SecurityEvent]:
        """Analiza conexiones ESTABLISHED buscando patrones de port scan.

        1. Obtiene conexiones establecidas via netstat
        2. Registra cada (IP remota -> puerto local) con timestamp
        3. Limpia entradas fuera de la ventana temporal
        4. Si una IP contactó > threshold puertos únicos, genera evento
        """
        events = []
        now = time.time()

        connections = await self._get_established()

        # Registrar nuevas conexiones
        for conn in connections:
            ip = conn["remote_addr"]
            port = conn["local_port"]
            self._connections[ip].append((now, port))

        # Evaluar cada IP
        for ip, entries in list(self._connections.items()):
            # Limpiar entradas fuera de ventana
            entries[:] = [(ts, p) for ts, p in entries if now - ts <= self.window]
            if not entries:
                del self._connections[ip]
                self._alerted_ips.discard(ip)
                continue

            # Contar puertos únicos en la ventana
            unique_ports = len(set(p for _, p in entries))

            if unique_ports > self.threshold and ip not in self._alerted_ips:
                self._alerted_ips.add(ip)
                events.append(SecurityEvent(
                    source="portscan",
                    event_type="port_scan_detected",
                    data={
                        "remote_ip": ip,
                        "unique_ports": unique_ports,
                        "window_seconds": self.window,
                        "sample_ports": sorted(set(p for _, p in entries))[:20],
                    },
                ))

        return events

    async def _get_established(self) -> list[dict]:
        """Obtiene conexiones TCP ESTABLISHED via netstat."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "netstat", "-ano",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
            output = stdout.decode("utf-8", errors="replace")

            connections = []
            for line in output.splitlines():
                parts = line.split()
                if len(parts) < 5:
                    continue
                if parts[0].upper() != "TCP" or parts[3] != "ESTABLISHED":
                    continue

                local = parts[1]
                remote = parts[2]

                try:
                    # Parsear local
                    if "]:" in local:
                        local_port = int(local.rsplit(":", 1)[1])
                    else:
                        local_port = int(local.rsplit(":", 1)[1])

                    # Parsear remote
                    if "]:" in remote:
                        remote_addr = remote.rsplit(":", 1)[0]
                        remote_addr = remote_addr.strip("[]")
                    else:
                        remote_addr = remote.rsplit(":", 1)[0]

                    # Ignorar localhost
                    if remote_addr in ("127.0.0.1", "::1", "0.0.0.0"):
                        continue

                    connections.append({
                        "local_port": local_port,
                        "remote_addr": remote_addr,
                    })
                except (ValueError, IndexError):
                    continue

            return connections
        except Exception as e:
            self.log.error("Error en netstat: %s", e)
            return []
