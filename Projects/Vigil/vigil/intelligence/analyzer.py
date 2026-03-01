"""Analizador que decide cuándo y cómo usar el LLM para enriquecer alertas."""

from __future__ import annotations

from ..core.config import OllamaConfig
from ..core.events import Alert, Severity
from ..core.logger import get_logger
from .cache import TTLCache
from .ollama import OllamaClient

log = get_logger("analyzer")


class OllamaAnalyzer:
    """Decide si una alerta merece análisis LLM y construye el prompt."""

    def __init__(self, config: OllamaConfig):
        self.config = config
        self.client = OllamaClient(config)
        self.cache = TTLCache(ttl=600, max_size=200)
        self._min_severity = Severity[config.min_severity]

    def should_analyze(self, alert: Alert) -> bool:
        """Decide si una alerta merece ser enriquecida por el LLM.

        Criterios:
        - Severidad >= min_severity configurada
        - Ollama está disponible (último check)
        - No está cacheada ya
        """
        if alert.severity < self._min_severity:
            return False
        if self.client._available is False:
            return False
        cache_key = self._cache_key(alert)
        if self.cache.get(cache_key) is not None:
            return False
        return True

    def _cache_key(self, alert: Alert) -> str:
        """Genera key de cache basada en rule_id + datos relevantes."""
        parts = [alert.rule_id]
        if alert.event and alert.event.data:
            for k in sorted(alert.event.data.keys()):
                parts.append(f"{k}:{alert.event.data[k]}")
        return "|".join(parts)

    def build_prompt(self, alert: Alert) -> str:
        """Construye el prompt para Ollama pidiendo explicación en español.

        El prompt incluye:
        - Contexto de que es un IDS personal
        - La alerta con todos sus datos
        - Instrucción de explicar en español, conciso, con recomendación
        """
        event_data = ""
        if alert.event and alert.event.data:
            event_data = "\n".join(f"  - {k}: {v}" for k, v in alert.event.data.items())

        return f"""Eres un analista de seguridad explicando alertas de un IDS personal en Windows 11.

Alerta detectada:
- Regla: {alert.rule_id}
- Severidad: {alert.severity.name}
- Título: {alert.title}
- Descripción: {alert.description}
- Datos del evento:
{event_data}

Explica en español en 2-3 oraciones:
1. Qué significa esta alerta para un usuario normal
2. Si es probablemente benigno o preocupante
3. Qué acción recomiendas (si alguna)

Sé conciso y directo."""

    async def analyze(self, alert: Alert) -> str | None:
        """Analiza una alerta con Ollama si corresponde. Retorna explicación o None."""
        if not self.should_analyze(alert):
            return None

        cache_key = self._cache_key(alert)

        # Check cache
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        prompt = self.build_prompt(alert)
        response = await self.client.generate(prompt)

        if response:
            self.cache.set(cache_key, response)
            log.debug("LLM explicación para %s obtenida (%d chars)", alert.rule_id, len(response))

        return response
