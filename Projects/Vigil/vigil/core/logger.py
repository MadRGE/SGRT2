"""Logging estructurado para Vigil."""

from __future__ import annotations

import logging
import sys


def setup_logging(level: str = "INFO") -> logging.Logger:
    """Configura y retorna el logger principal de Vigil.

    Usa formato estructurado con timestamp, nivel y módulo.
    Todo va a stderr para no interferir con stdout del banner.
    """
    logger = logging.getLogger("vigil")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        handler.setFormatter(logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s.%(module)s: %(message)s",
            datefmt="%H:%M:%S",
        ))
        logger.addHandler(handler)

    return logger


def get_logger(name: str) -> logging.Logger:
    """Retorna un child logger de vigil."""
    return logging.getLogger(f"vigil.{name}")
