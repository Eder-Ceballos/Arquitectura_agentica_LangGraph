"""
database.py
-----------
Configuración central de SQLAlchemy + SQLite.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ------------------------------------------------------------
# Cadena de conexión
# SQLite usa el archivo 'database.db' en la carpeta database/ del proyecto.
# La ruta es absoluta para funcionar bien desde cualquier directorio de ejecución.
# ------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATABASE_FILE = BASE_DIR / "database.db"
DATABASE_URL = f"sqlite:///{DATABASE_FILE.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
