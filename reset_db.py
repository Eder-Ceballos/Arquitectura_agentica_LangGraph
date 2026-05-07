"""
reset_db.py
-----------
Borra todos los datos de la base de datos y recarga las vacantes estáticas.
Las tablas y su estructura NO se modifican.

Uso:
    python reset_db.py
"""

from database.database import SessionLocal
from database.models import Habilidad, Perfil, AgentLog, Vacante
from database.init_db import load_static_vacancies


def reset_db():
    db = SessionLocal()
    try:
        habilidades = db.query(Habilidad).delete()
        perfiles = db.query(Perfil).delete()
        logs = db.query(AgentLog).delete()
        vacantes = db.query(Vacante).delete()
        db.commit()
        print(f"Eliminados: {perfiles} perfiles, {habilidades} habilidades, {vacantes} vacantes, {logs} logs.")
    finally:
        db.close()

    load_static_vacancies()
    print("Base de datos reseteada. Las vacantes estáticas fueron recargadas.")


if __name__ == "__main__":
    confirmar = input("Esto borrará TODOS los datos. ¿Confirmar? (s/n): ").strip().lower()
    if confirmar == "s":
        reset_db()
    else:
        print("Operación cancelada.")
