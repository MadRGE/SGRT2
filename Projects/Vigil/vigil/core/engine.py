"""Motor principal de Vigil — orquesta monitors, reglas y alertas."""

from __future__ import annotations

import asyncio
import os
import signal
from datetime import datetime
from pathlib import Path

from .config import VigilConfig, load_config
from .events import SecurityEvent
from .logger import get_logger, setup_logging
from .privilege import check_privileges
from .rule_engine import RuleEngine
from ..alerts.pipeline import AlertPipeline
from ..intelligence.analyzer import OllamaAnalyzer
from ..monitors.network import NetworkMonitor
from ..monitors.portscan import PortScanDetector
from ..monitors.eventlog import EventLogMonitor
from ..monitors.process import ProcessMonitor
from ..monitors.filesystem import FileSystemMonitor

log = get_logger("engine")


class VigilEngine:
    """Orquestador principal. Inicializa todos los componentes y los ejecuta.

    Flujo:
    1. Carga config → detecta privilegios → carga reglas
    2. Crea monitors según config (enabled/disabled)
    3. Crea AlertPipeline con OllamaAnalyzer
    4. Lanza cada monitor como asyncio.Task
    5. Event callback: SecurityEvent → RuleEngine → AlertPipeline
    """

    def __init__(self, config_path: Path | None = None, verbose: bool = False):
        self._config_path = config_path or Path("config.yaml")
        self._verbose = verbose
        self.config: VigilConfig | None = None
        self.rule_engine = RuleEngine()
        self.pipeline: AlertPipeline | None = None
        self.monitors: list = []
        self._tasks: list[asyncio.Task] = []
        self._running = False
        self._event_count = 0
        self._alert_count = 0
        self._dashboard = None
        self._start_time: datetime | None = None

    def setup(self) -> dict:
        """Inicializa todos los componentes. Retorna status dict para el banner."""
        # Logging
        level = "DEBUG" if self._verbose else "INFO"
        setup_logging(level)

        # Config
        self.config = load_config(self._config_path)
        log.info("Config cargada desde %s", self._config_path)

        # Privilegios
        priv = check_privileges()

        # Reglas
        rules_count = self.rule_engine.load_rules(self.config.rules_path)

        # Pipeline + LLM enricher
        analyzer = OllamaAnalyzer(self.config.ollama)
        self.pipeline = AlertPipeline(self.config.alerts, enricher=analyzer)

        # Monitors
        monitors_cfg = self.config.monitors
        monitors_status = {}

        if monitors_cfg.get("network") and monitors_cfg["network"].enabled:
            ignored_ports = set()
            if self.config.dashboard.enabled:
                ignored_ports.add(self.config.dashboard.port)
            self.monitors.append(NetworkMonitor(
                interval=monitors_cfg["network"].interval,
                trusted_processes=self.config.trusted_processes,
                ignored_ports=ignored_ports,
            ))
            monitors_status["network"] = "ON"
        else:
            monitors_status["network"] = "OFF"

        if monitors_cfg.get("portscan") and monitors_cfg["portscan"].enabled:
            self.monitors.append(PortScanDetector(
                interval=monitors_cfg["portscan"].interval,
            ))
            monitors_status["portscan"] = "ON"
        else:
            monitors_status["portscan"] = "OFF"

        if monitors_cfg.get("eventlog") and monitors_cfg["eventlog"].enabled:
            self.monitors.append(EventLogMonitor(
                interval=monitors_cfg["eventlog"].interval,
                is_admin=priv.is_admin,
            ))
            if "eventlog" in priv.degraded_monitors:
                monitors_status["eventlog"] = "DEGRADED"
            else:
                monitors_status["eventlog"] = "ON"
        else:
            monitors_status["eventlog"] = "OFF"

        if monitors_cfg.get("process") and monitors_cfg["process"].enabled:
            self.monitors.append(ProcessMonitor(
                interval=monitors_cfg["process"].interval,
                trusted_processes=self.config.trusted_processes,
            ))
            monitors_status["process"] = "ON"
        else:
            monitors_status["process"] = "OFF"

        if monitors_cfg.get("filesystem") and monitors_cfg["filesystem"].enabled:
            self.monitors.append(FileSystemMonitor(
                interval=monitors_cfg["filesystem"].interval,
                watched_paths=self.config.watched_paths,
            ))
            monitors_status["filesystem"] = "ON"
        else:
            monitors_status["filesystem"] = "OFF"

        # Dashboard
        if self.config.dashboard.enabled:
            from ..dashboard.server import DashboardServer
            self._dashboard = DashboardServer(
                host=self.config.dashboard.host,
                port=self.config.dashboard.port,
                engine=self,
            )

        return {
            "is_admin": priv.is_admin,
            "rules_loaded": rules_count,
            "monitors": monitors_status,
            "log_file": self.config.alerts.log_file,
            "toast": self.config.alerts.toast_enabled,
            "ollama_url": self.config.ollama.url,
            "ollama_model": self.config.ollama.model,
            "dashboard_url": f"http://{self.config.dashboard.host}:{self.config.dashboard.port}"
                if self.config.dashboard.enabled else None,
        }

    async def _on_event(self, event: SecurityEvent) -> None:
        """Callback invocado por cada monitor cuando genera un evento."""
        self._event_count += 1
        log.debug("Evento [%s] %s: %s", event.source, event.event_type, event.event_id)

        # Push al dashboard (fire-and-forget)
        if self._dashboard:
            self._dashboard.broadcast_event(event)

        # Evaluar contra reglas
        alerts = self.rule_engine.evaluate(event)

        # Procesar cada alerta por el pipeline
        for alert in alerts:
            emitted = await self.pipeline.process(alert)
            if emitted:
                self._alert_count += 1
                if self._dashboard:
                    self._dashboard.broadcast_alert(alert)

    def get_snapshot(self) -> dict:
        """Estado completo para nuevos clientes del dashboard."""
        snapshot = {
            "monitors": {},
            "stats": {
                "events_total": self._event_count,
                "alerts_total": self._alert_count,
                "uptime_seconds": (datetime.now() - self._start_time).total_seconds()
                    if self._start_time else 0,
            },
        }
        for monitor in self.monitors:
            snapshot["monitors"][monitor.name] = {
                "status": "running" if monitor._running else "stopped",
                "interval": monitor.interval,
                "state": monitor.get_state(),
            }
        return snapshot

    async def run(self) -> None:
        """Lanza todos los monitors como tasks async y espera hasta shutdown."""
        self._running = True
        self._start_time = datetime.now()

        # Registrar signal handlers para shutdown graceful
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, self._request_shutdown)
            except NotImplementedError:
                # Windows no soporta add_signal_handler para todos los signals
                pass

        # Dashboard
        if self._dashboard:
            task = asyncio.create_task(
                self._dashboard.start(),
                name="dashboard-server",
            )
            self._tasks.append(task)

        log.info("Iniciando %d monitors...", len(self.monitors))

        # Lanzar cada monitor como task
        for monitor in self.monitors:
            task = asyncio.create_task(
                monitor.start(self._on_event),
                name=f"monitor-{monitor.name}",
            )
            self._tasks.append(task)

        # Esperar hasta que se solicite shutdown
        try:
            while self._running:
                await asyncio.sleep(1)
        except (KeyboardInterrupt, asyncio.CancelledError):
            pass
        finally:
            await self._shutdown()

    def _request_shutdown(self) -> None:
        """Solicita shutdown graceful."""
        log.info("Shutdown solicitado...")
        self._running = False

    async def _shutdown(self) -> None:
        """Detiene todos los monitors y limpia tasks."""
        log.info("Deteniendo monitors...")

        # Parar dashboard
        if self._dashboard:
            await self._dashboard.stop()

        # Parar cada monitor
        for monitor in self.monitors:
            monitor.stop()

        # Cancelar tasks pendientes
        for task in self._tasks:
            if not task.done():
                task.cancel()

        # Esperar que terminen
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)

        self._tasks.clear()
        log.info(
            "Vigil detenido. Eventos procesados: %d, Alertas emitidas: %d",
            self._event_count, self._alert_count,
        )
