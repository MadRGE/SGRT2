"""Detección de privilegios y graceful degradation."""

from __future__ import annotations

import ctypes
import os
from dataclasses import dataclass

from .logger import get_logger

log = get_logger("privilege")


@dataclass
class PrivilegeInfo:
    is_admin: bool
    available_monitors: list[str]
    degraded_monitors: list[str]


def check_privileges() -> PrivilegeInfo:
    """Detecta si tenemos privilegios de admin y qué monitores están disponibles.

    Sin admin:
    - Security Event Log no funciona (necesita SeSecurityPrivilege)
    - Todo lo demás funciona normalmente con netstat/tasklist
    """
    is_admin = False
    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
    except (AttributeError, OSError):
        # No estamos en Windows o no hay windll
        is_admin = False

    all_monitors = ["network", "portscan", "eventlog", "process", "filesystem"]
    degraded = []

    if not is_admin:
        degraded.append("eventlog")
        log.warning("Sin privilegios de admin — Event Log degradado (solo Application/System)")

    available = [m for m in all_monitors if m not in degraded or m == "eventlog"]

    return PrivilegeInfo(
        is_admin=is_admin,
        available_monitors=available,
        degraded_monitors=degraded,
    )
