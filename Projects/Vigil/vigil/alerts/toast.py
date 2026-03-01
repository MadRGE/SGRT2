"""Notificaciones toast de Windows 11 via PowerShell WinRT."""

from __future__ import annotations

import asyncio
import html

from ..core.events import Alert, Severity
from ..core.logger import get_logger

log = get_logger("toast")

# Mapeo de severidad a emoji para el toast
_SEVERITY_ICON = {
    Severity.LOW: "ℹ️",
    Severity.MEDIUM: "⚠️",
    Severity.HIGH: "🔴",
    Severity.CRITICAL: "🚨",
}


def _build_toast_xml(alert: Alert) -> str:
    """Construye el XML de notificación WinRT."""
    icon = _SEVERITY_ICON.get(alert.severity, "🔔")
    title = html.escape(f"{icon} Vigil — {alert.severity.name}")
    body = html.escape(alert.title)
    detail = html.escape(alert.description[:200])

    return f"""
$xmlStr = @"
<toast duration="long">
    <visual>
        <binding template="ToastGeneric">
            <text>{title}</text>
            <text>{body}</text>
            <text placement="attribution">{detail}</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default"/>
</toast>
"@
[void][Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
[void][Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
$xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
$xml.LoadXml($xmlStr)
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Vigil IDS")
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$notifier.Show($toast)
"""


async def send_toast(alert: Alert) -> bool:
    """Envía una notificación toast de Windows. Retorna True si se envió."""
    ps_script = _build_toast_xml(alert)
    try:
        proc = await asyncio.create_subprocess_exec(
            "powershell", "-NoProfile", "-Command", ps_script,
            stdout=asyncio.subprocess.DEVNULL,
            stderr=asyncio.subprocess.PIPE,
        )
        _, stderr = await asyncio.wait_for(proc.communicate(), timeout=10)
        if proc.returncode != 0:
            log.warning("Toast falló (rc=%d): %s", proc.returncode, stderr.decode(errors="replace")[:200])
            return False
        log.debug("Toast enviado: %s", alert.title)
        return True
    except asyncio.TimeoutError:
        log.warning("Toast timeout")
        return False
    except Exception as e:
        log.warning("Toast error: %s", e)
        return False


async def send_test_toast() -> bool:
    """Envía un toast de prueba al iniciar Vigil."""
    test_alert = Alert(
        rule_id="TEST",
        severity=Severity.LOW,
        title="Vigil IDS iniciado",
        description="El sistema de detección de intrusiones está activo",
        event=None,  # type: ignore
    )
    return await send_toast(test_alert)
