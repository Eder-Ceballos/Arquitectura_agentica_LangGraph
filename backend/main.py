# main.py - API Backend para Magneto: Sistema de Agentes IA
from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import shutil
import os
import sqlite3
from typing import List, Optional
from pydantic import BaseModel

# Importaciones de módulos locales
from agents.tools.cv_parser import get_initial_state
from agents.graph import app_graph
from agents.nodes.validator import universal_validator_node
from database.database import engine, SessionLocal
from database.models import Base
from database.profile_repository import guardar_perfil

# --- CONFIGURACIÓN DE RUTA DINÁMICA ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "app.db")

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🗄️  Buscando base de datos en: {DB_PATH}")
    # Asegura que las tablas existan al iniciar el servidor en Arch
    Base.metadata.create_all(bind=engine)
    print("✅ Estructura de base de datos verificada.")
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
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Búsqueda insensible a mayúsculas
        cursor.execute("SELECT * FROM perfiles WHERE LOWER(email) = LOWER(?)", (email,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            # 404 limpio para que el frontend sepa que debe usar el fallback del contexto
            raise HTTPException(status_code=404, detail=f"Perfil con email {email} no encontrado")
        
        raw_data = dict(row)
        profile = {k: v for k, v in raw_data.items()}
        
        # Corrección de encoding para años de experiencia (soporte para caracteres especiales de SQLite)
        profile['años_experiencia'] = raw_data.get('aÃ±os_experiencia') or raw_data.get('años_experiencia') or 0
        
        # Carga dinámica de habilidades vinculadas desde la tabla relacionada
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
        # Construimos el diccionario con todos los campos editables
        update_data = {
            "email": email,
            "nombre": data.nombre,
            "cargo": data.cargo,
            "descripcion": data.descripcion,
            "ubicacion": data.ubicacion,
            "profesion": data.profesion,
            "años_experiencia": data.años_experiencia
        }
        
        # Persistimos usando SQLAlchemy
        save_candidate_to_db(update_data)
        return {"status": "success", "message": "Registro en app.db actualizado correctamente"}
    except Exception as e:
        print(f"❌ Error en PUT /profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS DE PROCESAMIENTO ---

@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    """Recibe, analiza mediante agentes y guarda el perfil en app.db si es válido."""
    file_path = os.path.join(BASE_DIR, "storage", "cvs", file.filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Ejecución del flujo de agentes (LangGraph)
        estado_inicial = get_initial_state(file_path)
        resultado_final = await app_graph.ainvoke(estado_inicial)

        if resultado_final.get("es_valido"):
            # Guardado automático de los datos extraídos
            save_candidate_to_db(resultado_final.get("perfil_normalizado"))

        return {
            "status": "success",
            "perfil_normalizado": resultado_final.get("perfil_normalizado"),
            "es_valido": resultado_final.get("es_valido"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico")
        }
    except Exception as e:
        print(f"❌ Error en procesamiento de CV: {e}")
        return {"status": "error", "detalle": str(e)}

@app.get("/")
def root():
    return {"message": "Magneto API Online", "db_path": DB_PATH}