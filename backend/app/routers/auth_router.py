from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import asyncpg

from ..database import get_db
from ..auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    nombre: str
    rol: str = "gestor"


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


def _user_dict(row: asyncpg.Record) -> dict:
    return {
        "id": str(row["id"]),
        "email": row["email"],
        "nombre": row["nombre"],
        "rol": row["rol"],
        "cliente_id": None,
    }


@router.post("/login")
async def login(body: LoginRequest, db: asyncpg.Connection = Depends(get_db)):
    row = await db.fetchrow("SELECT * FROM usuarios WHERE email = $1", body.email)
    if not row or not row["password_hash"]:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    token = create_token(str(row["id"]), row["email"], row["rol"])
    return {"token": token, "user": _user_dict(row)}


@router.post("/signup")
async def signup(body: SignupRequest, db: asyncpg.Connection = Depends(get_db)):
    existing = await db.fetchrow("SELECT id FROM usuarios WHERE email = $1", body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email ya registrado")
    hashed = hash_password(body.password)
    row = await db.fetchrow(
        "INSERT INTO usuarios (email, nombre, rol, password_hash) VALUES ($1, $2, $3, $4) RETURNING *",
        body.email, body.nombre, body.rol, hashed,
    )
    token = create_token(str(row["id"]), row["email"], row["rol"])
    return {"token": token, "user": _user_dict(row)}


@router.get("/me")
async def me(user: dict = Depends(get_current_user), db: asyncpg.Connection = Depends(get_db)):
    row = await db.fetchrow("SELECT * FROM usuarios WHERE id = $1", user["sub"])
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _user_dict(row)


@router.put("/password")
async def change_password(
    body: ChangePasswordRequest,
    user: dict = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow("SELECT * FROM usuarios WHERE id = $1", user["sub"])
    if not row or not verify_password(body.current_password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    hashed = hash_password(body.new_password)
    await db.execute("UPDATE usuarios SET password_hash = $1 WHERE id = $2", hashed, user["sub"])
    return {"detail": "Contraseña actualizada"}
