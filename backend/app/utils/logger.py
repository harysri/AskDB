import logging
import sys

from app.config import get_settings

_configured = False


def get_logger(name: str) -> logging.Logger:
    global _configured
    settings = get_settings()

    if not _configured:
        logging.basicConfig(
            level=getattr(logging, settings.log_level.upper(), logging.INFO),
            format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            stream=sys.stdout,
        )
        _configured = True

    return logging.getLogger(name)
