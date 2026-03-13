from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg

from ..database import get_db
from ..auth import get_current_user, require_admin, hash_password

router = APIRouter(prefix="/usuarios", tags=["usuarios"])


class CreateUsuario(BaseModel):
    email: str
    password: str
    nombre: str
    rol: str = "operador"
    cliente_id: str | None = None


class UpdateUsuario(BaseModel):
    nombre: str | None = None
    rol: str | None = None
    cliente_id: str | None = None
    activo: bool | None = None


class SetPassword(BaseModel):
    new_password: str


def _row_to_dict(row: asyncpg.Record) -> dict:
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "nombre": row["nombre"],
        "rol": row["rol"],
        "cliente_id": None,
        "activo": True,
        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
    }


@router.get("")
async def list_usuarios(
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch("SELECT * FROM usuarios ORDER BY created_at DESC")
    return [_row_to_dict(r) for r in rows]


@router.get("/{user_id}")
async def get_usuario(
    user_id: str,
    _: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow("SELECT * FROM usuarios WHERE id = $1", user_id)
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _row_to_dict(row)


@router.post("")
async def create_usuario(
    body: CreateUsuario,
    _: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db),
):
    existing = await db.fetchrow("SELECT id FROM usuarios WHERE email = $1", body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email ya registrado")
    hashed = hash_password(body.password)
    row = await db.fetchrow(
        "INSERT INTO usuarios (email, nombre, rol, password_hash) VALUES ($1, $2, $3, $4) RETURNING *",
        body.email, body.nombre, body.rol, hashed,
    )
    return _row_to_dict(row)


@router.put("/{user_id}")
async def update_usuario(
    user_id: str,
    body: UpdateUsuario,
    _: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db),
):
    sets, vals, i = [], [], 1
    for field in ["nombre", "rol"]:
        val = getattr(body, field)
        if val is not None:
            sets.append(f"{field} = ${i}")
            vals.append(val)
            i += 1
    if not sets:
        return {"detail": "Nada que actualizar"}
    vals.append(user_id)
    await db.execute(f"UPDATE usuarios SET {', '.join(sets)} WHERE id = ${i}", *vals)
    return {"detail": "Usuario actualizado"}


@router.put("/{user_id}/password")
async def set_password(
    user_id: str,
    body: SetPassword,
    _: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db),
):
    hashed = hash_password(body.new_password)
    await db.execute("UPDATE usuarios SET password_hash = $1 WHERE id = $2", hashed, user_id)
    return {"detail": "Contraseña actualizada"}


@router.delete("/{user_id}")
async def delete_usuario(
    user_id: str,
    _: dict = Depends(require_admin),
    db: asyncpg.Connection = Depends(get_db),
):
    await db.execute("DELETE FROM usuarios WHERE id = $1", user_id)
    return {"detail": "Usuario eliminado"}
