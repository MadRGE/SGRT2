import asyncpg
from .config import settings

pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
            ssl="require",
        )
    return pool


async def close_pool():
    global pool
    if pool:
        await pool.close()
        pool = None


async def get_db() -> asyncpg.Connection:
    """Dependency that yields a connection from the pool."""
    p = await get_pool()
    async with p.acquire() as conn:
        yield conn
