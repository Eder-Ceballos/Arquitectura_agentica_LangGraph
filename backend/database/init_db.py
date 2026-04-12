"""
init_db.py
----------
Script de inicialización. Crea todas las tablas en app.db si no existen.

Ejecutar UNA SOLA VEZ antes de correr el servidor:
    python init_db.py

También puede llamarse al arrancar la app (main.py / lifespan de FastAPI).
"""

from database import engine
from models import Base

def init_db():
    print("🗄️  Inicializando base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas correctamente:")
    print("   - perfiles")
    print("   - habilidades")

if __name__ == "__main__":
    init_db()
