"""Motor de reglas YAML — carga reglas y evalúa SecurityEvents."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml

from .events import Alert, SecurityEvent, Severity
from .logger import get_logger

log = get_logger("rules")


@dataclass
class Condition:
    field: str
    op: str      # eq, neq, gt, lt, gte, lte, in, contains
    value: object


@dataclass
class Rule:
    id: str
    name: str
    description: str
    severity: Severity
    source: str
    event_type: str
    conditions: list[Condition]
    alert_title: str
    alert_description: str

    def matches(self, event: SecurityEvent) -> bool:
        """Retorna True si el evento matchea source, event_type Y todas las condiciones."""
        if event.source != self.source:
            return False
        if event.event_type != self.event_type:
            return False
        return self._evaluate_conditions(event)

    def _evaluate_conditions(self, event: SecurityEvent) -> bool:
        """Evalúa todas las condiciones contra event.data.

        TODO: Implementar la lógica de evaluación de condiciones.

        Cada condición tiene:
        - field: clave en event.data
        - op: operador (eq, neq, gt, lt, gte, lte, in, contains)
        - value: valor esperado

        Semántica de operadores:
        - eq/neq: igualdad/desigualdad directa
        - gt/lt/gte/lte: comparación numérica
        - in: el valor del evento está EN la lista value
        - contains: el valor del evento (string) contiene value como substring

        Retorna True si TODAS las condiciones se cumplen (AND lógico).
        Si un field no existe en event.data, esa condición falla (False).
        """
        for cond in self.conditions:
            actual = event.get(cond.field)
            if actual is None:
                return False

            op = cond.op
            expected = cond.value

            if op == "eq":
                if actual != expected:
                    return False
            elif op == "neq":
                if actual == expected:
                    return False
            elif op == "gt":
                if not (actual > expected):
                    return False
            elif op == "lt":
                if not (actual < expected):
                    return False
            elif op == "gte":
                if not (actual >= expected):
                    return False
            elif op == "lte":
                if not (actual <= expected):
                    return False
            elif op == "in":
                if actual not in expected:
                    return False
            elif op == "contains":
                if str(expected) not in str(actual):
                    return False
            else:
                log.warning("Operador desconocido: %s en regla %s", op, self.id)
                return False

        return True

    def create_alert(self, event: SecurityEvent) -> Alert:
        """Crea una Alert formateando el título y descripción con event.data."""
        try:
            title = self.alert_title.format(**event.data)
            desc = self.alert_description.format(**event.data)
        except KeyError as e:
            title = f"[{self.id}] {self.name}"
            desc = f"Datos incompletos para formatear: {e}"

        return Alert(
            rule_id=self.id,
            severity=self.severity,
            title=title,
            description=desc,
            event=event,
        )


class RuleEngine:
    """Carga reglas YAML y evalúa eventos contra ellas."""

    def __init__(self):
        self.rules: list[Rule] = []

    def load_rules(self, path: str | Path) -> int:
        """Carga reglas desde un archivo YAML. Retorna cantidad cargada."""
        path = Path(path)
        if not path.exists():
            log.error("Archivo de reglas no encontrado: %s", path)
            return 0

        raw = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not raw or "rules" not in raw:
            log.error("Formato inválido en %s", path)
            return 0

        count = 0
        for r in raw["rules"]:
            try:
                conditions = [
                    Condition(field=c["field"], op=c["op"], value=c["value"])
                    for c in r.get("conditions", [])
                ]
                rule = Rule(
                    id=r["id"],
                    name=r["name"],
                    description=r.get("description", ""),
                    severity=Severity[r["severity"]],
                    source=r["source"],
                    event_type=r["event_type"],
                    conditions=conditions,
                    alert_title=r.get("alert_title", r["name"]),
                    alert_description=r.get("alert_description", r.get("description", "")),
                )
                self.rules.append(rule)
                count += 1
            except (KeyError, ValueError) as e:
                log.warning("Regla inválida (saltando): %s — %s", r.get("id", "?"), e)

        log.info("Cargadas %d reglas desde %s", count, path.name)
        return count

    def evaluate(self, event: SecurityEvent) -> list[Alert]:
        """Evalúa un evento contra todas las reglas. Retorna lista de alertas generadas."""
        alerts = []
        for rule in self.rules:
            if rule.matches(event):
                alert = rule.create_alert(event)
                log.info("Regla %s activada: %s", rule.id, alert.title)
                alerts.append(alert)
        return alerts
