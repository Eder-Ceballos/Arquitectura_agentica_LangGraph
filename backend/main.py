# main.py - API Backend para Magneto: Sistema de Agentes IA
from fastapi import FastAPI, UploadFile, File, Form, Body, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import shutil
import os
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
import sys
from pathlib import Path
from auth_utils import hash_password, verify_password, create_access_token
from sqlalchemy.orm import Session
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
from database.models import Base, Perfil
from database.init_db import load_static_vacancies
from database.profile_repository import guardar_perfil
from database.vacancy_repository import obtener_todas_las_vacantes, obtener_vacante_por_id
from ranking import calcular_ranking
from agents.postulation_graph import postulation_graph
from database.postulacion_repository import obtener_postulaciones_por_perfil
from database.models import PostulacionDB
from database.log_repository import (
    obtener_logs_por_run,
    obtener_logs_recientes,
    obtener_logs_por_agente,
    obtener_estado_agentes,
)
from agents.logger import imprimir_historial

# In-memory cache for recommendations { email: (timestamp, payload) }
_recommendations_cache: dict = {}
_RECOMMENDATIONS_TTL = 300  # 5 minutes

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
    salario: Optional[float] = 0.0


# --- ENDPOINTS DE AUTENTICACIÓN ---

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/v1/auth/register")
async def register(perfil_data: dict = Body(...)):
    """Registra un nuevo perfil con contraseña hasheada."""
    db = SessionLocal()
    try:
        # 1. Extraer la contraseña y hashearla
        raw_password = perfil_data.get("password")
        if not raw_password:
            raise HTTPException(status_code=400, detail="La contraseña es obligatoria")
        
        perfil_data["password_hash"] = hash_password(raw_password)
        
        # 2. Guardar usando tu repositorio
        perfil_orm = guardar_perfil(perfil_data, db)
        return {"status": "success", "message": "Usuario registrado exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.post("/api/v1/auth/login")
async def login(credentials: LoginRequest):
    """Verifica credenciales y devuelve un token JWT."""
    db = SessionLocal()
    try:
        # Buscar el perfil por email
        user = db.query(Perfil).filter(Perfil.email == credentials.email).first()
        
        if not user or not user.password_hash:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        # Verificar contraseña
        if not verify_password(credentials.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
        token = create_access_token({"sub": user.email})

        habilidades = [h.nombre for h in user.habilidades]
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id_perfil,
                "id_perfil": user.id_perfil,
                "email": user.email,
                "nombre": user.nombre,
                "cargo": user.cargo,
                "profesion": user.profesion,
                "descripcion": user.descripcion,
                "años_experiencia": user.años_experiencia,
                "ubicacion": user.ubicacion,
                "salario": user.salario,
                "habilidades": habilidades,
                "es_valido": len(habilidades) > 0 or bool(user.profesion),
            }
        }
    finally:
        db.close()

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
            "años_experiencia": data.años_experiencia,
            "salario": data.salario,
        }
        
        save_candidate_to_db(update_data)
        return {"status": "success", "message": f"Registro en {os.path.basename(DB_PATH)} actualizado"}
    except Exception as e:
        print(f"❌ Error en PUT /profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS DE PROCESAMIENTO ---

@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    profile_email: Optional[str] = Form(None),
):
    """Recibe, analiza mediante agentes y guarda el perfil en app.db si es válido.
    Si profile_email se provee (re-subida desde perfil), el CV actualiza ese perfil
    específico independientemente del email que Gemini extraiga del documento."""
    storage_path = os.path.join(BACKEND_DIR, "storage", "cvs")
    os.makedirs(storage_path, exist_ok=True)
    file_path = os.path.join(storage_path, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        run_id = str(uuid.uuid4())
        estado_inicial = get_initial_state(file_path)
        estado_inicial["run_id"] = run_id
        resultado_final = await app_graph.ainvoke(estado_inicial)
        imprimir_historial(run_id, resultado_final.get("history", []))

        perfil_data = resultado_final.get("perfil_normalizado") or {}

        # When re-uploading from the profile page, override the email so the
        # extracted data always lands on the authenticated user's profile.
        if profile_email:
            perfil_data["email"] = profile_email

        if resultado_final.get("es_valido"):
            save_candidate_to_db(perfil_data)

        email = perfil_data.get("email") or profile_email
        if email:
            db = SessionLocal()
            try:
                perfil_db = db.query(Perfil).filter(Perfil.email == email).first()
                if perfil_db:
                    perfil_data["id_perfil"] = perfil_db.id_perfil
                    perfil_data["id"] = perfil_db.id_perfil
            finally:
                db.close()
            for key in list(_recommendations_cache.keys()):
                if key.startswith(f"{email}:"):
                    del _recommendations_cache[key]

        return {
            "status": "success",
            "run_id": run_id,
            "perfil_normalizado": perfil_data,
            "es_valido": resultado_final.get("es_valido"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico"),
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.get("/api/v1/candidates/ranking")
def get_ranking(email: str = Query(..., description="Email del candidato")):
    """Devuelve las vacantes ordenadas por compatibilidad con el perfil del candidato."""
    db = SessionLocal()
    try:
        perfil_orm = db.query(Perfil).filter(Perfil.email == email).first()
        if not perfil_orm:
            raise HTTPException(status_code=404, detail=f"Perfil con email '{email}' no encontrado")

        perfil = {
            "habilidades": [h.nombre for h in perfil_orm.habilidades],
            "años_experiencia": perfil_orm.años_experiencia,
            "salario": perfil_orm.salario,
            "ubicacion": perfil_orm.ubicacion,
        }

        vacantes = obtener_todas_las_vacantes(db)
        ranking = calcular_ranking(perfil, vacantes)
        return {"status": "success", "candidato": perfil_orm.nombre, "ranking": ranking}
    finally:
        db.close()


@app.get("/api/v1/candidates/recommendations")
def get_recommendations(
    email: str = Query(..., description="Email del candidato"),
    limit: int = Query(default=7, ge=3, le=10),
    refresh: bool = Query(default=False, description="Forzar regeneración ignorando caché"),
):
    """Devuelve las top vacantes recomendadas con razones generadas por IA.
    Resultado cacheado en memoria por 5 minutos para evitar llamadas redundantes a Gemini."""
    import time as _time
    from agents.nodes.recommendation_agent import generar_razones_batch

    cache_key = f"{email}:{limit}"
    if not refresh:
        cached = _recommendations_cache.get(cache_key)
        if cached and (_time.time() - cached[0]) < _RECOMMENDATIONS_TTL:
            return cached[1]

    db = SessionLocal()
    try:
        perfil_orm = db.query(Perfil).filter(Perfil.email == email).first()
        if not perfil_orm:
            raise HTTPException(status_code=404, detail=f"Perfil con email '{email}' no encontrado")

        perfil = {
            "nombre": perfil_orm.nombre,
            "profesion": perfil_orm.profesion,
            "años_experiencia": perfil_orm.años_experiencia,
            "habilidades": [h.nombre for h in perfil_orm.habilidades],
            "salario": perfil_orm.salario,
            "ubicacion": perfil_orm.ubicacion,
        }

        vacantes = obtener_todas_las_vacantes(db)
        ranking = calcular_ranking(perfil, vacantes)
        top_n = ranking[:limit]
    finally:
        db.close()

    run_id = str(uuid.uuid4())
    razones = generar_razones_batch(perfil, top_n, run_id)

    recommendations = [
        {**item, "razon": razon or f"{item['score']}% de compatibilidad con tu perfil."}
        for item, razon in zip(top_n, razones)
    ]

    result = {"status": "success", "recommendations": recommendations}
    _recommendations_cache[cache_key] = (_time.time(), result)
    return result


@app.get("/api/v1/vacantes/{id_vacante}")
def get_vacante(id_vacante: str):
    """Retorna el detalle completo de una vacante por su ID."""
    db = SessionLocal()
    try:
        vacante = obtener_vacante_por_id(id_vacante, db)
        if not vacante:
            raise HTTPException(status_code=404, detail=f"Vacante '{id_vacante}' no encontrada")
        return {"status": "success", "vacante": vacante.to_dict()}
    finally:
        db.close()


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
        run_id = str(uuid.uuid4())
        state_to_revalidate = {
            "perfil_normalizado": corrected_data,
            "es_valido": False,
            "run_id": run_id,
            "history": [{"agente": "frontend_form", "evento": "correccion_manual"}],
        }

        resultado_final = universal_validator_node(state_to_revalidate, target="profile")

        if corrected_data:
            save_candidate_to_db(corrected_data)

        return {
            "status": "success",
            "run_id": run_id,
            "es_valido": resultado_final.get("es_valido"),
            "perfil_normalizado": corrected_data,
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico"),
            "historial": resultado_final.get("history"),
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.get("/api/v1/agents/status")
def get_agents_status():
    """
    Devuelve el estado actual de cada agente basado en sus logs más recientes.
    Alimenta el polling del DashboardPage del frontend.
    Los agentes sin actividad aún no aparecen (el frontend mantiene su estado mock).
    """
    db = SessionLocal()
    try:
        estado = obtener_estado_agentes(db)
        return {
            "agents": estado,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
    finally:
        db.close()


@app.get("/api/v1/logs")
def list_logs(
    limit: int = Query(default=50, ge=1, le=500),
    agente: Optional[str] = Query(default=None, description="Filtrar por agente (ej: agente_perfil)"),
):
    """Retorna los logs más recientes, opcionalmente filtrados por agente."""
    db = SessionLocal()
    try:
        if agente:
            logs = obtener_logs_por_agente(agente, db, limit=limit)
        else:
            logs = obtener_logs_recientes(db, limit=limit)
        return {"status": "success", "total": len(logs), "logs": [log.to_dict() for log in logs]}
    finally:
        db.close()


@app.get("/api/v1/logs/{run_id}")
def get_logs_by_run(run_id: str):
    """Retorna todos los logs de una ejecución específica del grafo."""
    db = SessionLocal()
    try:
        logs = obtener_logs_por_run(run_id, db)
        if not logs:
            raise HTTPException(status_code=404, detail=f"No se encontraron logs para run_id: {run_id}")
        return {"status": "success", "run_id": run_id, "total": len(logs), "logs": [log.to_dict() for log in logs]}
    finally:
        db.close()


class PostulacionRequest(BaseModel):
    id_perfil: int
    id_vacante: str


@app.post("/api/v1/postulaciones")
async def postular(req: PostulacionRequest):
    """Activa el grafo de postulación: application_node → tracker_node."""
    db = SessionLocal()
    try:
        perfil_orm = db.query(Perfil).filter(Perfil.id_perfil == req.id_perfil).first()
        if not perfil_orm:
            raise HTTPException(status_code=404, detail="Perfil no encontrado")

        vacante_orm = obtener_vacante_por_id(req.id_vacante, db)
        if not vacante_orm:
            raise HTTPException(status_code=404, detail="Vacante no encontrada")

        perfil = {
            "nombre": perfil_orm.nombre,
            "profesion": perfil_orm.profesion,
            "años_experiencia": perfil_orm.años_experiencia,
            "habilidades": [h.nombre for h in perfil_orm.habilidades],
            "cargo": perfil_orm.cargo,
            "ubicacion": perfil_orm.ubicacion,
            "salario": perfil_orm.salario,
        }
        vacante = vacante_orm.to_dict()

        vacantes_all = obtener_todas_las_vacantes(db)
        ranking = calcular_ranking(perfil, vacantes_all)
        entrada_ranking = next((v for v in ranking if v["id_vacante"] == req.id_vacante), {})
        score = entrada_ranking.get("score", 0)
        habilidades_match = entrada_ranking.get("breakdown", {}).get("habilidades_match", [])

    finally:
        db.close()

    run_id = str(uuid.uuid4())
    estado_inicial = {
        "run_id": run_id,
        "id_perfil": req.id_perfil,
        "id_vacante": req.id_vacante,
        "perfil": perfil,
        "vacante": vacante,
        "score": score,
        "habilidades_match": habilidades_match,
        "postulacion_id": None,
        "estado": "",
        "mensaje_confirmacion": "",
        "siguiente_paso": "",
        "error": None,
        "history": [],
    }

    try:
        resultado = await postulation_graph.ainvoke(estado_inicial)
        return {
            "status": "success",
            "run_id": run_id,
            "postulacion_id": resultado.get("postulacion_id"),
            "estado": resultado.get("estado"),
            "mensaje_confirmacion": resultado.get("mensaje_confirmacion"),
            "siguiente_paso": resultado.get("siguiente_paso"),
            "error": resultado.get("error"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/postulaciones/{id_perfil}")
def get_postulaciones(id_perfil: int):
    """Retorna todas las postulaciones de un candidato enriquecidas con datos de la vacante."""
    db = SessionLocal()
    try:
        postulaciones = obtener_postulaciones_por_perfil(id_perfil, db)
        resultado = []
        for p in postulaciones:
            data = p.to_dict()
            vacante = obtener_vacante_por_id(p.id_vacante, db)
            data["vacante"] = {
                "cargo": vacante.cargo,
                "empresa": vacante.empresa,
                "modalidad": vacante.modalidad,
                "ubicacion": vacante.ubicacion,
            } if vacante else {}
            resultado.append(data)
        return {"status": "success", "postulaciones": resultado}
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "Magneto API Online", "db_path": DB_PATH}