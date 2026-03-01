"""TTL cache simple para respuestas del LLM."""

from __future__ import annotations

import time


class TTLCache:
    """Cache en memoria con TTL (Time-To-Live) por entrada.

    Evita llamar al LLM repetidamente para alertas similares.
    La key es típicamente rule_id + datos relevantes del evento.
    """

    def __init__(self, ttl: int = 600, max_size: int = 200):
        self.ttl = ttl
        self.max_size = max_size
        self._store: dict[str, tuple[float, str]] = {}  # {key: (timestamp, value)}

    def get(self, key: str) -> str | None:
        """Retorna el valor cacheado o None si no existe / expiró."""
        entry = self._store.get(key)
        if entry is None:
            return None
        ts, value = entry
        if time.time() - ts > self.ttl:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: str) -> None:
        """Guarda un valor con timestamp actual. Limpia entradas viejas si excede max_size."""
        if len(self._store) >= self.max_size:
            self._evict_expired()
        if len(self._store) >= self.max_size:
            # Eliminar la entrada más vieja
            oldest_key = min(self._store, key=lambda k: self._store[k][0])
            del self._store[oldest_key]
        self._store[key] = (time.time(), value)

    def _evict_expired(self) -> None:
        """Elimina todas las entradas expiradas."""
        now = time.time()
        expired = [k for k, (ts, _) in self._store.items() if now - ts > self.ttl]
        for k in expired:
            del self._store[k]
