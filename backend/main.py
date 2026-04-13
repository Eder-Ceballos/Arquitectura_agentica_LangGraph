# main.py - API Backend para Magneto: Sistema de Agentes IA para Procesamiento de CVs
from fastapi import FastAPI, UploadFile, File, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import sqlite3
from typing import List
from pydantic import BaseModel

# Importaciones de módulos locales
from agents.tools.cv_parser import get_initial_state
from agents.graph import app_graph

app = FastAPI(title="IAGentes API - Magneto Edition")

# Ruta a la base de datos según tu estructura en Arch
DB_PATH = "database/app.db"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Modelo para la actualización manual desde el perfil
class ProfileUpdate(BaseModel):
    nombre: str
    descripcion: str
    cargo: str

# --- NUEVOS ENDPOINTS DE PERSISTENCIA ---

@app.get("/api/v1/profile/{email}")
async def get_profile(email: str):
    """Obtiene los datos del perfil directamente desde la base de datos."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Obtener datos principales del perfil 
        cursor.execute("SELECT * FROM perfiles WHERE email = ?", (email,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Perfil no encontrado en la DB")
        
        profile = dict(row)
        
        # Obtener habilidades relacionadas [cite: 31]
        cursor.execute("SELECT nombre FROM habilidades WHERE id_perfil = ?", (profile['id_perfil'],))
        profile['habilidades'] = [s['nombre'] for s in cursor.fetchall()]
        
        conn.close()
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/v1/profile/{email}")
async def update_profile(email: str, data: ProfileUpdate):
    """Actualiza nombre, cargo y descripción en la base de datos."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE perfiles 
            SET nombre = ?, cargo = ?, descripcion = ?, updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
        """, (data.nombre, data.cargo, data.descripcion, email))
        
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Base de datos actualizada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINTS EXISTENTES ACTUALIZADOS ---

@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    file_path = f"storage/cvs/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        estado_inicial = get_initial_state(file_path)
        resultado_final = await app_graph.ainvoke(estado_inicial)

        return {
            "status": "success",
            "perfil_normalizado": resultado_final.get("perfil_normalizado"),
            "es_valido": resultado_final.get("es_valido"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.post("/api/v1/candidates/revalidate")
async def revalidate_candidate(corrected_data: dict = Body(...)):
    try:
        state_to_revalidate = {
            "perfil_normalizado": corrected_data,
            "es_valido": False,
            "history": [{"agente": "frontend_form", "evento": "manual_correction"}]
        }

        resultado_final = await app_graph.ainvoke(state_to_revalidate)

        # PERSISTENCIA: Si el perfil es válido tras la corrección, se guarda/actualiza
        if resultado_final.get("es_valido"):
            p = resultado_final["perfil_normalizado"]
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Ejemplo de Upsert (Update or Insert) basado en el email 
            cursor.execute("""
                UPDATE perfiles SET 
                nombre = ?, telefono = ?, profesion = ?, descripcion = ?, 
                updated_at = CURRENT_TIMESTAMP 
                WHERE email = ?
            """, (p['nombre'], p['telefono'], p['profesion'], p['descripcion'], p['email']))
            
            conn.commit()
            conn.close()
            print(f"💾 Perfil de {p['nombre']} persistido en app.db")

        return {
            "status": "success",
            "es_valido": resultado_final.get("es_valido"),
            "perfil_normalizado": resultado_final.get("perfil_normalizado"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.get("/")
def root():
    return {"message": "API de IAgentes activa, vinculada al Grafo y conectada a app.db"}