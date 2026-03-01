"""Monitor de filesystem: detecta cambios en archivos críticos via watchdog.

Usa la librería watchdog para recibir notificaciones de cambios en tiempo real.
Los eventos se acumulan en una cola y se drenan en cada poll().

Monitorea paths de config.watched_paths (ej: hosts, networks).
Genera eventos file_modified y file_created.
"""

from __future__ import annotations

import queue
from pathlib import Path

from ..core.events import SecurityEvent
from .base import BaseMonitor


class FileSystemMonitor(BaseMonitor):
    """Vigila archivos y directorios críticos usando watchdog.

    watchdog corre en su propio thread via Observer. Los eventos
    se acumulan en una cola thread-safe que poll() drena cada ciclo.
    """

    def __init__(self, interval: int = 5, watched_paths: list[str] | None = None):
        super().__init__("filesystem", interval)
        self._watched_paths = watched_paths or []
        self._event_queue: queue.Queue = queue.Queue()
        self._observer = None
        self._watchdog_available = False

    async def setup(self) -> None:
        """Inicia el Observer de watchdog sobre los paths configurados."""
        try:
            from watchdog.observers import Observer
            from watchdog.events import FileSystemEventHandler
        except ImportError:
            self.log.warning("watchdog no disponible — FileSystem monitor deshabilitado")
            return

        self._watchdog_available = True

        # Handler que encola eventos relevantes
        monitor = self

        class _Handler(FileSystemEventHandler):
            def on_modified(self, event):
                if not event.is_directory:
                    monitor._event_queue.put(("file_modified", event.src_path))

            def on_created(self, event):
                if not event.is_directory:
                    monitor._event_queue.put(("file_created", event.src_path))

        handler = _Handler()
        self._observer = Observer()

        watched = 0
        for path_str in self._watched_paths:
            path = Path(path_str)
            if path.is_file():
                # Watchdog vigila directorios, así que vigilamos el padre
                watch_path = str(path.parent)
            elif path.is_dir():
                watch_path = str(path)
            else:
                self.log.debug("Path no existe (saltando): %s", path_str)
                continue

            try:
                self._observer.schedule(handler, watch_path, recursive=False)
                watched += 1
                self.log.debug("Vigilando: %s", watch_path)
            except Exception as e:
                self.log.warning("No se puede vigilar %s: %s", watch_path, e)

        if watched > 0:
            self._observer.start()
            self.log.info("Vigilando %d paths", watched)
        else:
            self.log.warning("No hay paths válidos para vigilar")

    async def poll(self) -> list[SecurityEvent]:
        """Drena la cola de eventos de watchdog y genera SecurityEvents."""
        if not self._watchdog_available:
            return []

        events = []
        # Drenar toda la cola sin bloquear
        while True:
            try:
                event_type, src_path = self._event_queue.get_nowait()
            except queue.Empty:
                break

            # Filtrar: solo alertar si el archivo modificado está en watched_paths
            # o si se creó un archivo nuevo en un directorio vigilado
            path = Path(src_path)

            if event_type == "file_modified":
                # Solo alertar si es un archivo que vigilamos específicamente
                if not self._is_watched_file(src_path):
                    continue
                events.append(SecurityEvent(
                    source="filesystem",
                    event_type="file_modified",
                    data={
                        "file_path": src_path,
                        "file_name": path.name,
                        "directory": str(path.parent),
                    },
                ))

            elif event_type == "file_created":
                events.append(SecurityEvent(
                    source="filesystem",
                    event_type="file_created",
                    data={
                        "file_path": src_path,
                        "file_name": path.name,
                        "directory": str(path.parent),
                    },
                ))

        return events

    def _is_watched_file(self, filepath: str) -> bool:
        """Verifica si un archivo está en la lista de vigilancia."""
        filepath_lower = filepath.lower().replace("/", "\\")
        for watched in self._watched_paths:
            watched_lower = watched.lower().replace("/", "\\")
            # Match exacto o el archivo está dentro del directorio vigilado
            if filepath_lower == watched_lower:
                return True
            if Path(watched).is_dir() and filepath_lower.startswith(watched_lower):
                return True
        return True  # Si vigila un directorio, todo es relevante

    def stop(self) -> None:
        """Detiene el Observer de watchdog y el monitor."""
        if self._observer and self._observer.is_alive():
            self._observer.stop()
            self._observer.join(timeout=5)
        super().stop()
