"""
database.py
-----------
Configuración central de SQLAlchemy + SQLite.

Uso en otros módulos:
    from database import get_db, engine
    from models import Base

    Base.metadata.create_all(bind=engine)   # Crea las tablas si no existen
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ------------------------------------------------------------
# Cadena de conexión
# SQLite crea el archivo 'app.db' en la raíz del backend
# automáticamente si no existe. No requiere instalación ni
# configuración de servidor.
# Para migrar a PostgreSQL en el futuro, solo cambia esta línea:
#   "postgresql://usuario:password@localhost:5432/nombre_db"
# ------------------------------------------------------------
DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Necesario solo para SQLite con FastAPI
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    """
    Generador de sesión para inyección de dependencias en FastAPI.

    Uso en un endpoint:
        @app.get("/ejemplo")
        def ejemplo(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
