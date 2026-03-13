from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import get_pool, close_pool
from .routers import auth_router, usuarios_router, dashboard_router, clientes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(
    title="SGRT2 API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers under /api/v2
app.include_router(auth_router.router, prefix="/api/v2")
app.include_router(usuarios_router.router, prefix="/api/v2")
app.include_router(dashboard_router.router, prefix="/api/v2")
app.include_router(clientes_router.router, prefix="/api/v2")


@app.get("/api/v2/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}
