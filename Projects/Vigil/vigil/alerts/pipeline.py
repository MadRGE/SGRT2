"""Pipeline de alertas: deduplicación, throttling y routing."""

from __future__ import annotations

import time
from collections import defaultdict

from ..core.config import AlertConfig
from ..core.events import Alert
from ..core.logger import get_logger
from .log_alert import AlertLog
from .toast import send_toast

log = get_logger("pipeline")


class AlertPipeline:
    """Procesa alertas: dedup → throttle → enrich (LLM) → toast + log."""

    def __init__(self, config: AlertConfig, enricher=None):
        self.config = config
        self.enricher = enricher  # OllamaAnalyzer (se setea después)
        self.alert_log = AlertLog(config.log_file)

        # Para dedup: {hash -> timestamp}
        self._seen: dict[str, float] = {}
        # Para throttle: {rule_id -> last_alert_time}
        self._last_alert: dict[str, float] = defaultdict(float)

    def _dedup_key(self, alert: Alert) -> str:
        """Genera una clave para deduplicación basada en regla + datos relevantes."""
        event_data = alert.event.data if alert.event else {}
        # Combinar rule_id con campos clave del evento
        key_parts = [alert.rule_id]
        for k in sorted(event_data.keys()):
            key_parts.append(f"{k}={event_data[k]}")
        return "|".join(key_parts)

    def _is_duplicate(self, alert: Alert) -> bool:
        """Verifica si una alerta es duplicada dentro de la ventana de dedup.

        Usa _dedup_key() para generar un hash del contenido.
        Si la misma key se vio dentro de dedup_window segundos, es duplicada.
        También limpia entradas expiradas para evitar memory leak.
        """
        now = time.time()
        key = self._dedup_key(alert)

        # Limpiar entradas expiradas
        expired = [k for k, t in self._seen.items() if now - t > self.config.dedup_window]
        for k in expired:
            del self._seen[k]

        if key in self._seen:
            return True

        self._seen[key] = now
        return False

    def _is_throttled(self, alert: Alert) -> bool:
        """Aplica throttle por rule_id."""
        now = time.time()
        last = self._last_alert[alert.rule_id]
        if now - last < self.config.throttle_per_rule:
            return True
        self._last_alert[alert.rule_id] = now
        return False

    async def process(self, alert: Alert) -> bool:
        """Procesa una alerta a través del pipeline completo. Retorna True si se emitió."""
        # 1. Dedup
        if self._is_duplicate(alert):
            log.debug("Alerta duplicada (descartada): %s", alert.rule_id)
            return False

        # 2. Throttle
        if self._is_throttled(alert):
            log.debug("Alerta throttled: %s", alert.rule_id)
            return False

        # 3. LLM enrichment (async, no bloquea)
        if self.enricher:
            try:
                explanation = await self.enricher.analyze(alert)
                if explanation:
                    alert.llm_explanation = explanation
            except Exception as e:
                log.debug("LLM enrichment falló (continuando): %s", e)

        # 4. Log siempre
        await self.alert_log.write(alert)

        # 5. Toast si habilitado
        if self.config.toast_enabled:
            await send_toast(alert)

        log.info("[%s] %s — %s", alert.severity.name, alert.rule_id, alert.title)
        return True
