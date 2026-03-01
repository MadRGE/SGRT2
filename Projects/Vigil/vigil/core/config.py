"""Carga y validación de configuración YAML."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class MonitorConfig:
    enabled: bool = True
    interval: int = 30  # segundos entre polls


@dataclass
class OllamaConfig:
    url: str = "http://localhost:11434"
    model: str = "phi3"
    timeout: int = 30
    min_severity: str = "MEDIUM"  # severidad mínima para enriquecer con LLM
    rate_limit: float = 2.0       # segundos entre llamadas


@dataclass
class AlertConfig:
    log_file: str = "alerts.jsonl"
    toast_enabled: bool = True
    dedup_window: int = 300       # segundos para considerar duplicado
    throttle_per_rule: int = 60   # mínimo segundos entre alertas de la misma regla


@dataclass
class DashboardConfig:
    enabled: bool = True
    host: str = "127.0.0.1"
    port: int = 8080


@dataclass
class VigilConfig:
    monitors: dict[str, MonitorConfig] = field(default_factory=dict)
    ollama: OllamaConfig = field(default_factory=OllamaConfig)
    alerts: AlertConfig = field(default_factory=AlertConfig)
    rules_path: str = ""
    watched_paths: list[str] = field(default_factory=list)
    trusted_processes: list[str] = field(default_factory=list)
    dashboard: DashboardConfig = field(default_factory=DashboardConfig)


_MONITOR_DEFAULTS = {
    "network": MonitorConfig(interval=15),
    "portscan": MonitorConfig(interval=10),
    "eventlog": MonitorConfig(interval=60),
    "process": MonitorConfig(interval=20),
    "filesystem": MonitorConfig(interval=5),
}


def load_config(path: Path) -> VigilConfig:
    """Carga config.yaml y retorna VigilConfig con defaults sensatos."""
    raw: dict = {}
    if path.exists():
        raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}

    # Monitors
    monitors = {}
    raw_monitors = raw.get("monitors", {})
    for name, defaults in _MONITOR_DEFAULTS.items():
        mon_raw = raw_monitors.get(name, {})
        monitors[name] = MonitorConfig(
            enabled=mon_raw.get("enabled", defaults.enabled),
            interval=mon_raw.get("interval", defaults.interval),
        )

    # Ollama
    raw_ollama = raw.get("ollama", {})
    ollama = OllamaConfig(
        url=raw_ollama.get("url", OllamaConfig.url),
        model=raw_ollama.get("model", OllamaConfig.model),
        timeout=raw_ollama.get("timeout", OllamaConfig.timeout),
        min_severity=raw_ollama.get("min_severity", OllamaConfig.min_severity),
        rate_limit=raw_ollama.get("rate_limit", OllamaConfig.rate_limit),
    )

    # Alerts
    raw_alerts = raw.get("alerts", {})
    alerts = AlertConfig(
        log_file=raw_alerts.get("log_file", AlertConfig.log_file),
        toast_enabled=raw_alerts.get("toast_enabled", AlertConfig.toast_enabled),
        dedup_window=raw_alerts.get("dedup_window", AlertConfig.dedup_window),
        throttle_per_rule=raw_alerts.get("throttle_per_rule", AlertConfig.throttle_per_rule),
    )

    # Rules path
    default_rules = str(Path(__file__).parent.parent / "rules" / "default_rules.yaml")
    rules_path = raw.get("rules_path", default_rules)

    # Watched paths (filesystem monitor)
    watched_paths = raw.get("watched_paths", [
        r"C:\Windows\System32\drivers\etc\hosts",
        r"C:\Windows\System32\drivers\etc\networks",
    ])

    # Trusted processes
    trusted_processes = raw.get("trusted_processes", [
        "svchost.exe", "System", "explorer.exe", "csrss.exe",
        "lsass.exe", "services.exe", "wininit.exe", "winlogon.exe",
    ])

    # Dashboard
    raw_dashboard = raw.get("dashboard", {})
    dashboard = DashboardConfig(
        enabled=raw_dashboard.get("enabled", DashboardConfig.enabled),
        host=raw_dashboard.get("host", DashboardConfig.host),
        port=raw_dashboard.get("port", DashboardConfig.port),
    )

    return VigilConfig(
        monitors=monitors,
        ollama=ollama,
        alerts=alerts,
        rules_path=rules_path,
        watched_paths=watched_paths,
        trusted_processes=trusted_processes,
        dashboard=dashboard,
    )
