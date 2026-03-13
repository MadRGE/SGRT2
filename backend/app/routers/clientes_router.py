from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg

from ..database import get_db
from ..auth import get_current_user

router = APIRouter(prefix="/clientes", tags=["clientes"])


class ClienteCreate(BaseModel):
    razon_social: str
    cuit: str | None = None
    rne: str | None = None
    email: str | None = None
    telefono: str | None = None
    contacto_nombre: str | None = None
    origen: str = "directo"
    referido_por: str | None = None
    direccion: str | None = None
    localidad: str | None = None
    provincia: str | None = None
    notas: str | None = None


class ClienteUpdate(BaseModel):
    razon_social: str | None = None
    cuit: str | None = None
    rne: str | None = None
    email: str | None = None
    telefono: str | None = None
    contacto_nombre: str | None = None
    direccion: str | None = None
    localidad: str | None = None
    provincia: str | None = None
    notas: str | None = None


def _row_to_dict(row: asyncpg.Record) -> dict:
    d = dict(row)
    d["id"] = str(d["id"])
    if d.get("created_at"):
        d["created_at"] = d["created_at"].isoformat()
    if d.get("deleted_at"):
        d["deleted_at"] = d["deleted_at"].isoformat()
    return d


@router.get("")
async def list_clientes(
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch("SELECT * FROM clientes WHERE deleted_at IS NULL ORDER BY razon_social")
    return [_row_to_dict(r) for r in rows]


@router.get("/{cliente_id}")
async def get_cliente(
    cliente_id: str,
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow("SELECT * FROM clientes WHERE id = $1", cliente_id)
    if not row:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return _row_to_dict(row)


@router.post("")
async def create_cliente(
    body: ClienteCreate,
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        """INSERT INTO clientes (razon_social, cuit, rne, email, telefono, contacto_nombre,
           origen, referido_por, direccion, localidad, provincia, notas)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *""",
        body.razon_social, body.cuit, body.rne, body.email, body.telefono,
        body.contacto_nombre, body.origen, body.referido_por, body.direccion,
        body.localidad, body.provincia, body.notas,
    )
    return _row_to_dict(row)


@router.put("/{cliente_id}")
async def update_cliente(
    cliente_id: str,
    body: ClienteUpdate,
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        return {"detail": "Nada que actualizar"}
    sets = [f"{k} = ${i+1}" for i, k in enumerate(data.keys())]
    vals = list(data.values()) + [cliente_id]
    await db.execute(
        f"UPDATE clientes SET {', '.join(sets)} WHERE id = ${len(vals)}",
        *vals,
    )
    return {"detail": "Cliente actualizado"}


@router.delete("/{cliente_id}")
async def delete_cliente(
    cliente_id: str,
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    await db.execute("UPDATE clientes SET deleted_at = now() WHERE id = $1", cliente_id)
    return {"detail": "Cliente eliminado"}
