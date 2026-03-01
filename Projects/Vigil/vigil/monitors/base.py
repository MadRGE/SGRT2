"""Base class para todos los monitores."""

from __future__ import annotations

import asyncio
from abc import ABC, abstractmethod

from ..core.events import SecurityEvent
from ..core.logger import get_logger


class BaseMonitor(ABC):
    """Monitor base con loop async de polling.

    Subclases implementan:
    - setup(): inicialización (una vez)
    - poll(): retorna lista de SecurityEvent
    """

    def __init__(self, name: str, interval: int = 30):
        self.name = name
        self.interval = interval
        self.log = get_logger(f"monitor.{name}")
        self._running = False
        self._task: asyncio.Task | None = None

    def get_state(self) -> dict:
        """Retorna estado actual del monitor para el dashboard. Override en subclases."""
        return {}

    async def setup(self) -> None:
        """Inicialización del monitor. Override si necesita setup."""
        pass

    @abstractmethod
    async def poll(self) -> list[SecurityEvent]:
        """Ejecuta un ciclo de monitoreo. Retorna eventos detectados."""
        ...

    async def start(self, callback) -> None:
        """Inicia el loop de polling. callback recibe cada SecurityEvent."""
        self._running = True
        await self.setup()
        self.log.info("Monitor '%s' iniciado (intervalo=%ds)", self.name, self.interval)

        while self._running:
            try:
                events = await self.poll()
                for event in events:
                    await callback(event)
            except Exception as e:
                self.log.error("Error en poll: %s", e)
            await asyncio.sleep(self.interval)

    def stop(self) -> None:
        """Detiene el monitor."""
        self._running = False
        if self._task:
            self._task.cancel()
        self.log.info("Monitor '%s' detenido", self.name)
