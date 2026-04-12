from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import shutil
import os

from agents.tools.cv_parser import get_initial_state
from agents.graph import app_graph
from database.database import engine
from database.models import Base


# Crea las tablas en app.db al arrancar (si no existen)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🗄️  Inicializando base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos lista.")
    yield


app = FastAPI(title="IAGentes API - Multi-Agente Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    # 1. Guardar el archivo
    file_path = f"storage/cvs/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. El parser extrae el texto y arma el estado inicial
        estado_inicial = get_initial_state(file_path)

        # 3. LangGraph ejecuta los agentes (Gemini + persistencia)
        resultado_final = await app_graph.ainvoke(estado_inicial)

        # 4. Respuesta al frontend
        return {
            "status": "success",
            "perfil": resultado_final.get("perfil_normalizado"),
            "status_db": resultado_final.get("status_db"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        return {"status": "error", "detalle": str(e)}


@app.get("/")
def root():
    return {"message": "API de IAgentes activa y vinculada al Grafo"}
