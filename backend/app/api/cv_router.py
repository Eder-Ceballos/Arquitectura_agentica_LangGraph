import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

# --- NUEVOS IMPORTS PARA LA CONEXIÓN ---
from agents.tools.cv_parser import parse_cv  # Nuestra herramienta de extracción
from agents.graph import app_graph           # El grafo que dejó tu equipo
# ---------------------------------------

router = APIRouter()

STORAGE_DIR = "storage/cvs"
os.makedirs(STORAGE_DIR, exist_ok=True)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

@router.post("/upload-cv/", status_code=201)
async def upload_cv(user_id: str, file: UploadFile = File(...)):
    # 1. Validaciones básicas (Extensión y Tamaño)
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Usa .pdf o .docx")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo excede los 20MB")

    # 2. Guardado físico con nombre único
    file_id = str(uuid.uuid4())
    file_path = os.path.join(STORAGE_DIR, f"{file_id}{ext}")
    
    with open(file_path, "wb") as f:
        f.write(content)

    # 3. TRIGGER AUTOMÁTICO (Aquí ocurre la magia)
    try:
        # Extraemos el texto usando nuestra herramienta
        extracted_text = parse_cv(file_path)
        
        # Preparamos el estado inicial para LangGraph
        initial_state = {
            "user_id": user_id,
            "file_id": file_id,
            "cv_raw_text": extracted_text,
            "logs": [f"Archivo {file.filename} recibido y procesado correctamente."],
            "current_step": "parsing"
        }

        # Invocamos al grafo de manera asíncrona (AQUÍ EMPIEZAN LOS AGENTES)
        # Nota: Usamos await porque la IA toma su tiempo en responder
        final_result = await app_graph.ainvoke(initial_state)

        return {
            "status": "success",
            "message": "CV analizado por los agentes",
            "file_id": file_id,
            "analysis_result": final_result # Esto nos mostrará qué hizo la IA
        }

    except Exception as e:
        # Si algo falla en la IA o el Parser, notificamos pero el archivo ya quedó guardado
        raise HTTPException(status_code=500, detail=f"Error procesando el CV: {str(e)}")