"""Crea usuario admin en Supabase Auth + tabla usuarios"""
from supabase import create_client

SUPABASE_URL = "https://qisowxnfjpvlkbdxmykb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc293eG5manB2bGtiZHhteWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NjAyNjQsImV4cCI6MjA4NDEzNjI2NH0.Rd92jxhAZSa2Vlm8lsU01RvdZlMvy-ukeg3f4CP3Mrs"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

EMAIL = "admin@sgrt.com"
PASSWORD = "admin123"
NOMBRE = "Administrador"

# 1. Crear usuario en Supabase Auth
res = supabase.auth.sign_up({"email": EMAIL, "password": PASSWORD})

if res.user:
    print(f"Usuario Auth creado: {res.user.id}")
    # 2. Insertar en tabla usuarios con rol admin
    supabase.table("usuarios").upsert({
        "id": res.user.id,
        "email": EMAIL,
        "nombre": NOMBRE,
        "apellido": "SGT",
        "rol": "admin",
    }).execute()
    print("Insertado en tabla usuarios con rol admin")
else:
    print("Error creando usuario:", res)

print(f"\n--- Credenciales ---")
print(f"Email:    {EMAIL}")
print(f"Password: {PASSWORD}")
print(f"Rol:      admin")
