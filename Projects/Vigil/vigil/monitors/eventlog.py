"""Monitor de Windows Event Log via win32evtlog (pywin32).

Monitorea canales de eventos buscando indicadores de compromiso:
- Security: 4625 (login fallido), 7045 (servicio instalado)
- Microsoft-Windows-Defender: 5001 (protección deshabilitada)
- Microsoft-Windows-PowerShell: 4104 (script block logging)

Sin admin, solo lee Application/System (graceful degradation).
"""

from __future__ import annotations

import asyncio
import time
import xml.etree.ElementTree as ET

from ..core.events import SecurityEvent
from .base import BaseMonitor

# Canales y Event IDs de interés
_CHANNELS = {
    "Security": {
        4625: "failed_login",
        7045: "service_installed",
    },
    "Microsoft-Windows-Windows Defender/Operational": {
        5001: "defender_disabled",
    },
    "Microsoft-Windows-PowerShell/Operational": {
        4104: "powershell_script_block",
    },
}

# Canales que NO necesitan admin
_SAFE_CHANNELS = {
    "Application",
    "System",
    "Microsoft-Windows-Windows Defender/Operational",
    "Microsoft-Windows-PowerShell/Operational",
}


class EventLogMonitor(BaseMonitor):
    """Lee Windows Event Log buscando eventos sospechosos.

    Usa win32evtlog.EvtQuery con bookmark para leer solo
    eventos nuevos desde el último poll.
    """

    def __init__(self, interval: int = 60, is_admin: bool = False):
        super().__init__("eventlog", interval)
        self._is_admin = is_admin
        self._bookmarks: dict[str, int] = {}  # channel -> last record number
        self._win32evtlog = None

    async def setup(self) -> None:
        """Importa win32evtlog y marca la posición actual en cada canal."""
        try:
            import win32evtlog
            self._win32evtlog = win32evtlog
        except ImportError:
            self.log.warning("pywin32 no disponible — EventLog monitor deshabilitado")
            return

        # Determinar canales accesibles
        channels = list(_CHANNELS.keys())
        if not self._is_admin:
            channels = [c for c in channels if c in _SAFE_CHANNELS]
            self.log.info("Sin admin — canales limitados: %s", channels)

        # Marcar posición actual (no alertar sobre eventos pasados)
        for channel in channels:
            try:
                bookmark = await self._get_latest_record(channel)
                self._bookmarks[channel] = bookmark
                self.log.debug("Bookmark %s: record %d", channel, bookmark)
            except Exception as e:
                self.log.debug("Canal %s no accesible: %s", channel, e)

        self.log.info("Monitoreando %d canales de Event Log", len(self._bookmarks))

    async def poll(self) -> list[SecurityEvent]:
        """Lee eventos nuevos desde el último bookmark en cada canal."""
        if self._win32evtlog is None:
            return []

        events = []
        for channel in list(self._bookmarks.keys()):
            try:
                new_events = await self._read_new_events(channel)
                events.extend(new_events)
            except Exception as e:
                self.log.debug("Error leyendo %s: %s", channel, e)

        return events

    async def _get_latest_record(self, channel: str) -> int:
        """Obtiene el número del último registro en un canal."""
        evtlog = self._win32evtlog

        def _query():
            try:
                handle = evtlog.OpenEventLog(None, channel)
                try:
                    total = evtlog.GetNumberOfEventLogRecords(handle)
                    return total
                finally:
                    evtlog.CloseEventLog(handle)
            except Exception:
                return 0

        return await asyncio.get_event_loop().run_in_executor(None, _query)

    async def _read_new_events(self, channel: str) -> list[SecurityEvent]:
        """Lee eventos nuevos de un canal desde el bookmark."""
        evtlog = self._win32evtlog
        last_record = self._bookmarks.get(channel, 0)
        interest = _CHANNELS.get(channel, {})

        def _query():
            results = []
            try:
                handle = evtlog.OpenEventLog(None, channel)
                try:
                    flags = (evtlog.EVENTLOG_FORWARDS_READ |
                             evtlog.EVENTLOG_SEQUENTIAL_READ)
                    while True:
                        records = evtlog.ReadEventLog(handle, flags, 0)
                        if not records:
                            break
                        for record in records:
                            results.append(record)
                finally:
                    evtlog.CloseEventLog(handle)
            except Exception:
                pass
            return results

        all_records = await asyncio.get_event_loop().run_in_executor(None, _query)

        events = []
        max_record = last_record

        for record in all_records:
            rec_num = getattr(record, "RecordNumber", 0)
            if rec_num <= last_record:
                continue

            max_record = max(max_record, rec_num)
            event_id = getattr(record, "EventID", 0) & 0xFFFF  # Mask high bits

            if event_id not in interest:
                continue

            event_type = interest[event_id]
            data = self._extract_record_data(record, event_id, channel)

            events.append(SecurityEvent(
                source="eventlog",
                event_type=event_type,
                data=data,
            ))

        if max_record > last_record:
            self._bookmarks[channel] = max_record

        return events

    def _extract_record_data(self, record, event_id: int, channel: str) -> dict:
        """Extrae datos relevantes de un registro de evento."""
        data = {
            "event_id": event_id,
            "channel": channel,
            "source_name": getattr(record, "SourceName", ""),
            "time_generated": str(getattr(record, "TimeGenerated", "")),
        }

        # Extraer strings del evento
        strings = getattr(record, "StringInserts", None) or ()

        if event_id == 4625:
            # Failed login: TargetUserName suele estar en posición 5
            data["target_user"] = strings[5] if len(strings) > 5 else "unknown"
            data["workstation"] = strings[13] if len(strings) > 13 else "unknown"
            data["ip_address"] = strings[19] if len(strings) > 19 else "unknown"
            data["logon_type"] = strings[10] if len(strings) > 10 else "unknown"

        elif event_id == 7045:
            # New service installed
            data["service_name"] = strings[0] if len(strings) > 0 else "unknown"
            data["service_path"] = strings[1] if len(strings) > 1 else "unknown"
            data["service_type"] = strings[2] if len(strings) > 2 else "unknown"
            data["service_start"] = strings[3] if len(strings) > 3 else "unknown"

        elif event_id == 5001:
            # Defender disabled
            data["component"] = strings[0] if len(strings) > 0 else "Real-time Protection"

        elif event_id == 4104:
            # PowerShell script block
            script_text = strings[2] if len(strings) > 2 else ""
            # Solo guardar un fragmento (puede ser muy largo)
            data["script_block"] = script_text[:500] if script_text else ""
            data["script_path"] = strings[4] if len(strings) > 4 else ""

        return data
