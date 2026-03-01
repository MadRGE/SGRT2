"""Log de alertas en formato JSONL (una línea JSON por alerta)."""

from __future__ import annotations

import json
from pathlib import Path

from ..core.events import Alert
from ..core.logger import get_logger

log = get_logger("log_alert")


class AlertLog:
    """Escribe alertas en un archivo JSONL append-only."""

    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    async def write(self, alert: Alert) -> None:
        """Append una alerta serializada como una línea JSON."""
        try:
            line = json.dumps(alert.to_dict(), ensure_ascii=False)
            with self.path.open("a", encoding="utf-8") as f:
                f.write(line + "\n")
            log.debug("Alerta logueada: %s", alert.alert_id)
        except Exception as e:
            log.error("Error escribiendo alerta: %s", e)
