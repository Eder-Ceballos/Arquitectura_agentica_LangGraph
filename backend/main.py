from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# Importación limpia gracias a los __init__.py que acabas de crear
from agents.tools.cv_parser import get_initial_state
from agents.graph import app_graph

app = FastAPI(title="IAGentes API - Multi-Agente Platform")

# CORS para que el frontend de tu amigo no explote
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# OJO: Fíjate que NO hay slash al final de "upload-cv"
@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    # 1. Guardar el archivo
    file_path = f"storage/cvs/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. El parser extrae el texto y arma el estado
        estado_inicial = get_initial_state(file_path)

        # 3. LangGraph hace la magia con Gemini
        resultado_final = await app_graph.ainvoke(estado_inicial)

        # 4. Devolvemos la respuesta al frontend/curl
        return {
            "status": "success",
            "perfil": resultado_final.get("perfil_normalizado"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}

@app.get("/")
def root():
    return {"message": "API de IAgentes activa y vinculada al Grafo"}