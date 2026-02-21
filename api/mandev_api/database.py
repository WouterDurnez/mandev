"""Database helpers.

Piccolo tables query themselves directly via the global engine
configured in ``piccolo_conf.py``, so no session dependency is needed.
This module provides transaction helpers if required.
"""

from piccolo.engine import engine_finder


async def get_engine():
    """Return the current Piccolo engine instance.

    :returns: The active database engine.
    """
    return engine_finder()
