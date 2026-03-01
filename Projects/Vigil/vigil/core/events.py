"""Dataclasses centrales del sistema: SecurityEvent, Alert, Severity."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import IntEnum


class Severity(IntEnum):
    """Nivel de severidad. IntEnum permite comparaciones directas (LOW < HIGH)."""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class SecurityEvent:
    """Observación cruda producida por un monitor.

    Cada monitor genera estos eventos. El RuleEngine los evalúa
    contra reglas YAML para decidir si generan una Alert.
    """
    source: str          # ej: "network", "process", "filesystem"
    event_type: str      # ej: "new_listener", "suspicious_process"
    data: dict           # payload libre del monitor
    timestamp: datetime = field(default_factory=datetime.now)
    event_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])

    def get(self, key: str, default=None):
        """Acceso rápido a data[key] para las reglas."""
        return self.data.get(key, default)


@dataclass
class Alert:
    """Alerta generada cuando un evento matchea una regla."""
    rule_id: str         # ej: "NET001"
    severity: Severity
    title: str
    description: str
    event: SecurityEvent
    llm_explanation: str | None = None
    alert_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        """Serializa para JSONL."""
        return {
            "alert_id": self.alert_id,
            "rule_id": self.rule_id,
            "severity": self.severity.name,
            "title": self.title,
            "description": self.description,
            "llm_explanation": self.llm_explanation,
            "timestamp": self.timestamp.isoformat(),
            "event": {
                "source": self.event.source,
                "event_type": self.event.event_type,
                "data": self.event.data,
                "event_id": self.event.event_id,
                "timestamp": self.event.timestamp.isoformat(),
            },
        }
