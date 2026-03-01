"""Cliente Ollama con rate limiting para enriquecimiento de alertas."""

from __future__ import annotations

import asyncio
import time

import httpx

from ..core.config import OllamaConfig
from ..core.logger import get_logger

log = get_logger("ollama")


class OllamaClient:
    """Cliente HTTP para la API de Ollama con rate limiting."""

    def __init__(self, config: OllamaConfig):
        self.config = config
        self._last_call: float = 0
        self._available: bool | None = None  # None = no chequeado

    async def is_available(self) -> bool:
        """Verifica si Ollama está corriendo."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.config.url}/api/tags",
                    timeout=5,
                )
                self._available = resp.status_code == 200
                return self._available
        except (httpx.ConnectError, httpx.TimeoutException):
            self._available = False
            return False

    async def generate(self, prompt: str) -> str | None:
        """Genera una respuesta con rate limiting. Retorna None si falla."""
        # Rate limiting
        now = time.time()
        wait = self.config.rate_limit - (now - self._last_call)
        if wait > 0:
            await asyncio.sleep(wait)

        self._last_call = time.time()

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.config.url}/api/generate",
                    json={
                        "model": self.config.model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.3,
                            "num_predict": 300,
                        },
                    },
                    timeout=self.config.timeout,
                )
                if resp.status_code == 200:
                    return resp.json().get("response", "").strip()
                else:
                    log.warning("Ollama respondió %d", resp.status_code)
                    return None
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            log.debug("Ollama no disponible: %s", e)
            self._available = False
            return None
        except Exception as e:
            log.warning("Error en Ollama: %s", e)
            return None
