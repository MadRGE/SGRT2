from fastapi import APIRouter, Depends
import asyncpg

from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def stats(
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    clientes = await db.fetchval("SELECT COUNT(*) FROM clientes WHERE deleted_at IS NULL")
    proyectos = await db.fetchval("SELECT COUNT(*) FROM proyectos")
    expedientes = await db.fetchval("SELECT COUNT(*) FROM expedientes")
    tramites = await db.fetchval("SELECT COUNT(*) FROM tramites")
    cotizaciones = await db.fetchval("SELECT COUNT(*) FROM cotizaciones")
    despachos = await db.fetchval("SELECT COUNT(*) FROM despachos WHERE deleted_at IS NULL")

    return {
        "clientes": clientes,
        "proyectos": proyectos,
        "expedientes": expedientes,
        "tramites": tramites,
        "cotizaciones": cotizaciones,
        "despachos": despachos,
    }


@router.get("/tramites-atencion")
async def tramites_atencion(
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch("""
        SELECT e.id, e.codigo, e.estado, e.semaforo, e.progreso, e.fecha_limite,
               tt.nombre as tramite_nombre, tt.organismo_id,
               p.nombre_proyecto, c.razon_social
        FROM expedientes e
        JOIN tramite_tipos tt ON e.tramite_tipo_id = tt.id
        JOIN proyectos p ON e.proyecto_id = p.id
        JOIN clientes c ON p.cliente_id = c.id
        WHERE e.estado NOT IN ('completado', 'aprobado')
          AND (e.semaforo IN ('rojo', 'amarillo') OR e.fecha_limite < now())
        ORDER BY e.fecha_limite ASC
        LIMIT 20
    """)
    return [dict(r) for r in rows]


@router.get("/gestiones-recientes")
async def gestiones_recientes(
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch("""
        SELECT p.id, p.nombre_proyecto, p.estado, p.prioridad, p.created_at,
               c.razon_social,
               (SELECT COUNT(*) FROM expedientes e WHERE e.proyecto_id = p.id) as total_expedientes
        FROM proyectos p
        JOIN clientes c ON p.cliente_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 10
    """)
    return [dict(r) for r in rows]
