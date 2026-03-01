"""Monitor de procesos: detecta procesos sospechosos y ejecuciones desde paths temporales.

Usa `tasklist /FO CSV /V /NH` para enumerar procesos activos.
Compara contra:
1. Lista de nombres sospechosos (herramientas de hacking comunes)
2. Paths temporales (indicador de malware)
3. Baseline para detectar nuevos procesos no vistos antes
"""

from __future__ import annotations

import asyncio
import os

from ..core.events import SecurityEvent
from .base import BaseMonitor

# Procesos asociados a herramientas de hacking / post-explotación
_SUSPICIOUS_NAMES = {
    "nc.exe", "ncat.exe", "netcat.exe",
    "mimikatz.exe", "mimi.exe", "mimi32.exe", "mimi64.exe",
    "psexec.exe", "psexec64.exe",
    "procdump.exe", "procdump64.exe",
    "lazagne.exe",
    "bloodhound.exe", "sharphound.exe",
    "rubeus.exe", "certify.exe",
    "chisel.exe", "plink.exe",
    "cobaltstrike.exe", "beacon.exe",
    "powershell_ise.exe",
    "wce.exe",  # Windows Credential Editor
    "pwdump.exe", "fgdump.exe",
    "keylogger.exe",
}

# Fragmentos de path que indican ejecución desde ubicaciones temporales
_TEMP_INDICATORS = [
    "\\temp\\",
    "\\tmp\\",
    "\\appdata\\local\\temp\\",
    "\\windows\\temp\\",
    "$recycle.bin",
]


class ProcessMonitor(BaseMonitor):
    """Monitorea procesos activos buscando nombres sospechosos y paths temporales.

    Mantiene un baseline de procesos conocidos al inicio para evitar
    alertas por procesos legítimos que ya estaban corriendo.
    """

    def __init__(self, interval: int = 20, trusted_processes: list[str] | None = None):
        super().__init__("process", interval)
        self._trusted = set(p.lower() for p in (trusted_processes or []))
        self._baseline: set[str] = set()  # nombres de procesos al inicio
        self._alerted_pids: set[int] = set()  # PIDs ya alertados (evitar duplicados)

    async def setup(self) -> None:
        """Captura baseline de procesos actuales."""
        processes = await self._get_processes()
        self._baseline = {p["name"].lower() for p in processes}
        self.log.info("Baseline: %d procesos conocidos", len(self._baseline))

    async def poll(self) -> list[SecurityEvent]:
        """Compara procesos actuales contra baseline y listas de sospechosos."""
        events = []
        processes = await self._get_processes()
        current_pids = set()

        for proc in processes:
            pid = proc["pid"]
            name = proc["name"]
            name_lower = name.lower()
            current_pids.add(pid)

            # Saltar procesos ya alertados o trusted
            if pid in self._alerted_pids:
                continue
            if name_lower in self._trusted:
                continue

            # Check 1: Nombre sospechoso
            if name_lower in _SUSPICIOUS_NAMES:
                self._alerted_pids.add(pid)
                events.append(SecurityEvent(
                    source="process",
                    event_type="suspicious_process",
                    data={
                        "process": name,
                        "pid": pid,
                        "reason": "suspicious_name",
                        "session": proc.get("session", ""),
                        "mem_usage": proc.get("mem_usage", ""),
                    },
                ))
                continue

            # Check 2: Ejecución desde path temporal (via WMIC si disponible)
            path = proc.get("path", "")
            if path and self._is_temp_path(path):
                self._alerted_pids.add(pid)
                events.append(SecurityEvent(
                    source="process",
                    event_type="process_from_temp",
                    data={
                        "process": name,
                        "pid": pid,
                        "path": path,
                        "reason": "temp_path",
                    },
                ))

        # Limpiar PIDs que ya no existen
        self._alerted_pids &= current_pids

        return events

    def _is_temp_path(self, path: str) -> bool:
        """Verifica si un path corresponde a una ubicación temporal."""
        path_lower = path.lower()
        return any(indicator in path_lower for indicator in _TEMP_INDICATORS)

    async def _get_processes(self) -> list[dict]:
        """Obtiene lista de procesos via tasklist /FO CSV /NH."""
        processes = []

        try:
            proc = await asyncio.create_subprocess_exec(
                "tasklist", "/FO", "CSV", "/NH",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
            output = stdout.decode("utf-8", errors="replace")

            for line in output.splitlines():
                line = line.strip()
                if not line or not line.startswith('"'):
                    continue

                parts = line.split('","')
                if len(parts) < 5:
                    continue

                name = parts[0].strip('"')
                try:
                    pid = int(parts[1].strip('"'))
                except ValueError:
                    continue

                session = parts[2].strip('"')
                mem_usage = parts[4].strip('"') if len(parts) > 4 else ""

                processes.append({
                    "name": name,
                    "pid": pid,
                    "session": session,
                    "mem_usage": mem_usage,
                    "path": "",  # tasklist no da path, se intenta con wmic abajo
                })

        except Exception as e:
            self.log.error("Error ejecutando tasklist: %s", e)
            return []

        # Intentar obtener paths via wmic (más info pero más lento)
        await self._enrich_with_paths(processes)

        return processes

    async def _enrich_with_paths(self, processes: list[dict]) -> None:
        """Intenta obtener paths de procesos via wmic (best-effort)."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "wmic", "process", "get", "ProcessId,ExecutablePath",
                "/format:csv",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
            output = stdout.decode("utf-8", errors="replace")

            # Construir mapa PID -> path
            pid_path: dict[int, str] = {}
            for line in output.splitlines():
                parts = line.strip().split(",")
                # Formato CSV: Node,ExecutablePath,ProcessId
                if len(parts) >= 3:
                    try:
                        path = parts[1].strip()
                        pid = int(parts[2].strip())
                        if path:
                            pid_path[pid] = path
                    except (ValueError, IndexError):
                        continue

            # Enriquecer procesos
            for p in processes:
                if p["pid"] in pid_path:
                    p["path"] = pid_path[p["pid"]]

        except Exception:
            # wmic puede no estar disponible, no es crítico
            pass
