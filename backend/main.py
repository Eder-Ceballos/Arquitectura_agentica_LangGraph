# main.py - API Backend para Magneto: Sistema de Agentes IA
from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import shutil
import os
from dotenv import load_dotenv
import sys
from pathlib import Path
load_dotenv()

# --- CONFIGURACIÓN DE RUTAS ---
# ROOT_DIR es la raíz del proyecto (donde están backend, agents, database, etc.)
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = Path(__file__).resolve().parent

for path in [str(ROOT_DIR), str(BACKEND_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

import sqlite3
from typing import List, Optional
from pydantic import BaseModel

# Importaciones de módulos locales
from agents.tools.cv_parser import get_initial_state
from agents.graph import app_graph
from agents.nodes.validator import universal_validator_node
from database.database import engine, SessionLocal
from database.models import Base
from database.init_db import load_static_vacancies
from database.profile_repository import guardar_perfil
from database.vacancy_repository import obtener_todas_las_vacantes

# --- CAMBIO CLAVE: RUTA DE LA DB EN database/app.db ---
# Esto asegura que sqlite3.connect use el mismo archivo que SQLAlchemy
DB_PATH = os.path.join(ROOT_DIR, "database", "database.db")

def save_candidate_to_db(perfil: dict):
    """Utiliza el repositorio para persistir datos mediante SQLAlchemy."""
    if not isinstance(perfil, dict) or not perfil:
        return None

    db = SessionLocal()
    try:
        # guardar_perfil maneja la lógica de "update or create" basada en el email
        return guardar_perfil(perfil, db)
    finally:
        db.close()

# Crea las tablas al arrancar (si no existen)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Aseguramos que el directorio database exista por si acaso
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    print(f"🗄️  Sincronizando base de datos en: {DB_PATH}")
    
    # Base.metadata usa el engine definido en database/database.py
    # Asegúrate de que en database.py la URL también apunte a database/app.db
    Base.metadata.create_all(bind=engine)
    load_static_vacancies()
    print("✅ Base de datos lista y vacantes estáticas sincronizadas.")
    yield

app = FastAPI(title="IAGentes API - Multi-Agente Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS DE DATOS ---

class ProfileUpdate(BaseModel):
    nombre: str
    descripcion: str
    cargo: str
    ubicacion: Optional[str] = "No especificada"
    profesion: Optional[str] = "No especificada"
    años_experiencia: Optional[int] = 0

# --- ENDPOINTS DE CONSULTA Y EDICIÓN ---

@app.get("/api/v1/profile/{email}")
async def get_profile(email: str):
    """Obtiene datos de la DB manejando el encoding y perfiles inexistentes."""
    try:
        # Usamos la nueva ruta DB_PATH
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM perfiles WHERE LOWER(email) = LOWER(?)", (email,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Perfil con email {email} no encontrado")
        
        raw_data = dict(row)
        profile = {k: v for k, v in raw_data.items()}
        
        # Soporte para el campo de años con encoding variable
        profile['años_experiencia'] = raw_data.get('años_experiencia') or raw_data.get('aÃ±os_experiencia') or 0
        
        cursor.execute("SELECT nombre FROM habilidades WHERE id_perfil = ?", (profile['id_perfil'],))
        profile['habilidades'] = [s['nombre'] for s in cursor.fetchall()]
        
        conn.close()
        return profile
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error interno en GET /profile: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar los datos del perfil")

@app.put("/api/v1/profile/{email}")
async def update_profile(email: str, data: ProfileUpdate):
    """Actualiza la persistencia íntegra tras una edición manual en el frontend."""
    try:
        update_data = {
            "email": email,
            "nombre": data.nombre,
            "cargo": data.cargo,
            "descripcion": data.descripcion,
            "ubicacion": data.ubicacion,
            "profesion": data.profesion,
            "años_experiencia": data.años_experiencia
        }
        
        save_candidate_to_db(update_data)
        return {"status": "success", "message": f"Registro en {os.path.basename(DB_PATH)} actualizado"}
    except Exception as e:
        print(f"❌ Error en PUT /profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS DE PROCESAMIENTO ---

@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    """Recibe, analiza mediante agentes y guarda el perfil en app.db si es válido."""
    # Los CVs se guardan en backend/storage/cvs/
    storage_path = os.path.join(BACKEND_DIR, "storage", "cvs")
    os.makedirs(storage_path, exist_ok=True)
    file_path = os.path.join(storage_path, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        estado_inicial = get_initial_state(file_path)
        resultado_final = await app_graph.ainvoke(estado_inicial)

        if resultado_final.get("es_valido"):
            save_candidate_to_db(resultado_final.get("perfil_normalizado"))

        return {
            "status": "success",
            "perfil_normalizado": resultado_final.get("perfil_normalizado"),
            "es_valido": resultado_final.get("es_valido"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico")
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.get("/api/v1/vacantes")
def list_vacantes():
    db = SessionLocal()
    try:
        vacantes = [vacante.to_dict() for vacante in obtener_todas_las_vacantes(db)]
        return {"status": "success", "vacantes": vacantes}
    finally:
        db.close()

@app.post("/api/v1/candidates/revalidate")
async def revalidate_candidate(corrected_data: dict = Body(...)):
    try:
        state_to_revalidate = {
            "perfil_normalizado": corrected_data,
            "es_valido": False,
            "history": [{"agente": "frontend_form", "evento": "manual_correction"}]
        }

        resultado_final = universal_validator_node(state_to_revalidate, target="profile")

        if corrected_data:
            save_candidate_to_db(corrected_data)

        return {
            "status": "success",
            "es_valido": resultado_final.get("es_valido"),
            "perfil_normalizado": corrected_data,
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.get("/")
def root():
    return {"message": "Magneto API Online", "db_path": DB_PATH}