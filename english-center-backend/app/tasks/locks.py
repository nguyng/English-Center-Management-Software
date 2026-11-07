import asyncio
from typing import Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Global asyncio lock for single-process / SQLite fallback
_memory_lock = asyncio.Lock()

async def try_acquire_advisory_lock(db: AsyncSession, lock_id: int = 20261105) -> bool:
    """Attempt to acquire a distributed advisory lock.
    Uses PostgreSQL pg_try_advisory_lock if supported, falls back to asyncio.Lock.
    """
    bind = db.get_bind()
    if bind and "postgresql" in str(bind.url):
        try:
            result = await db.execute(text("SELECT pg_try_advisory_lock(:id)"), {"id": lock_id})
            acquired = result.scalar()
            return bool(acquired)
        except Exception:
            return False
    else:
        # SQLite / Memory fallback
        if _memory_lock.locked():
            return False
        await _memory_lock.acquire()
        return True

async def release_advisory_lock(db: AsyncSession, lock_id: int = 20261105) -> None:
    """Release advisory lock."""
    bind = db.get_bind()
    if bind and "postgresql" in str(bind.url):
        try:
            await db.execute(text("SELECT pg_advisory_unlock(:id)"), {"id": lock_id})
        except Exception:
            pass
    else:
        if _memory_lock.locked():
            _memory_lock.release()

