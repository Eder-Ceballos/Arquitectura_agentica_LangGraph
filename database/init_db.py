"""
init_db.py
----------
Script de inicialización. Crea todas las tablas en database/database.db si no existen
y carga la lista estática de vacantes desde el archivo raíz Vacantes.
"""

import json
import os
from database.database import engine, SessionLocal
from database.models import Base
from database.vacancy_repository import guardar_vacante


def init_db():
    print("🗄️  Inicializando base de datos...")
    Base.metadata.create_all(bind=engine)
    load_static_vacancies()
    print("✅ Tablas creadas y vacantes cargadas correctamente.")


def load_static_vacancies():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    vacancies_file = os.path.join(root_dir, "Vacantes")

    if not os.path.exists(vacancies_file):
        print(f"⚠️ Archivo de vacantes no encontrado: {vacancies_file}")
        return

    with open(vacancies_file, encoding="utf-8") as file:
        try:
            vacantes = json.load(file)
        except json.JSONDecodeError as e:
            print(f"❌ Error al leer Vacantes: {e}")
            return

    db = SessionLocal()
    try:
        for vacante in vacantes:
            guardar_vacante(vacante, db)
    finally:
        db.close()

    print(f"✅ Se cargaron {len(vacantes)} vacantes estáticas en la base de datos.")


if __name__ == "__main__":
    init_db()
