"""Seed the admin user with a proper bcrypt password hash."""
import asyncio
import asyncpg
from passlib.context import CryptContext

DATABASE_URL = "postgresql://neondb_owner:npg_TrkaRNE6W7xo@ep-snowy-waterfall-akyen08c-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require"

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main():
    conn = await asyncpg.connect(DATABASE_URL, ssl="require")
    hashed = pwd.hash("admin123")
    await conn.execute(
        "UPDATE usuarios SET password_hash = $1 WHERE email = $2",
        hashed, "admin@sgrt.com",
    )
    print("Admin password set: admin@sgrt.com / admin123")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
