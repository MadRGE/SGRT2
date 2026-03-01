"""Entry point: python -m vigil

Muestra banner con status de componentes, parsea args y lanza el engine.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path


BANNER = r"""
 __     ___       _ _   ___ ____  ____
 \ \   / (_) __ _(_) | |_ _|  _ \/ ___|
  \ \ / /| |/ _` | | |  | || | | \___ \
   \ V / | | (_| | | |  | || |_| |___) |
    \_/  |_|\__, |_|_| |___|____/|____/
            |___/
   Personal Intrusion Detection System
   Windows 11 · v0.1.0
"""


def _status_icon(status: str) -> str:
    """Retorna icono de texto para status de componente."""
    if status == "ON":
        return "[+]"
    elif status == "DEGRADED":
        return "[~]"
    elif status == "OFF":
        return "[-]"
    return "[?]"


def _print_banner(status: dict) -> None:
    """Imprime banner ASCII con status de cada componente."""
    print(BANNER)
    print("=" * 50)

    # Privilegios
    admin = "Admin" if status["is_admin"] else "Usuario normal"
    print(f"  Privilegios:  {admin}")
    print(f"  Reglas:       {status['rules_loaded']} cargadas")
    print(f"  Log:          {status['log_file']}")
    print()

    # Monitors
    print("  Monitors:")
    for name, state in status["monitors"].items():
        icon = _status_icon(state)
        print(f"    {icon} {name:<12} {state}")
    print()

    # Alertas
    toast = "ON" if status["toast"] else "OFF"
    print(f"  Toast:        {toast}")
    print(f"  Ollama:       {status['ollama_model']} @ {status['ollama_url']}")

    if status.get("dashboard_url"):
        print(f"  Dashboard:    {status['dashboard_url']}")

    print("=" * 50)
    print("  Ctrl+C para detener")
    print()


def main() -> None:
    """Parsea argumentos y arranca Vigil."""
    parser = argparse.ArgumentParser(
        prog="vigil",
        description="Vigil IDS — Sistema de detección de intrusiones personal",
    )
    parser.add_argument(
        "-c", "--config",
        type=Path,
        default=Path("config.yaml"),
        help="Ruta al archivo de configuración (default: config.yaml)",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Habilitar logging verbose (DEBUG)",
    )
    args = parser.parse_args()

    # Importar engine aquí para que el banner se vea rápido
    from .core.engine import VigilEngine

    engine = VigilEngine(config_path=args.config, verbose=args.verbose)

    try:
        status = engine.setup()
    except Exception as e:
        print(f"Error inicializando Vigil: {e}", file=sys.stderr)
        sys.exit(1)

    _print_banner(status)

    # Lanzar loop async
    try:
        asyncio.run(engine.run())
    except KeyboardInterrupt:
        print("\nVigil detenido.")


if __name__ == "__main__":
    main()
