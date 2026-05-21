"""
reset_db.py
-----------
Borra todos los datos de la base de datos y recarga las vacantes estáticas.
Las tablas y su estructura NO se modifican.

Orden de borrado (respeta FK):
  1. postulaciones  (referencia perfiles + vacantes)
  2. habilidades    (referencia perfiles)
  3. agent_logs
  4. perfiles
  5. vacantes
  → recarga vacantes estáticas

Uso:
    python reset_db.py
"""

from database.database import SessionLocal
from database.models import Habilidad, Perfil, AgentLog, Vacante, PostulacionDB
from database.init_db import load_static_vacancies


def reset_db():
    db = SessionLocal()
    try:
        postulaciones = db.query(PostulacionDB).delete()
        habilidades   = db.query(Habilidad).delete()
        logs          = db.query(AgentLog).delete()
        perfiles      = db.query(Perfil).delete()
        vacantes      = db.query(Vacante).delete()
        db.commit()
        print(
            f"Eliminados: {perfiles} perfiles, {habilidades} habilidades, "
            f"{vacantes} vacantes, {postulaciones} postulaciones, {logs} logs."
        )
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
