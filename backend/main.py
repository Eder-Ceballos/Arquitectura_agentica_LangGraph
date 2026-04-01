from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # <-- ¡ESTA ES LA LÍNEA MÁGICA QUE FALTA!

from agents.graph import app_graph  # Lo que dejó tu equipo
from app.api.cv_router import router as cv_router # Lo que creamos nosotros

app = FastAPI(title="IAGentes API - Multi-Agente Platform")

#--------------AGREGADO PARA VER SI FUNCIONA-----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Permite la web de tu amigo
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, etc.
    allow_headers=["*"], # Permite todos los encabezados
)
#-----------HASTA AQUI LLEGA EL HDP



# 1. Registramos nuestro nuevo router para carga de archivos
# Esto nos da el endpoint: POST /api/v1/candidates/upload-cv/
app.include_router(cv_router, prefix="/api/v1/candidates", tags=["Candidatos"])

# 2. Mantenemos/Ajustamos el endpoint de análisis (Opcional si quieres usarlo directo)
@app.post("/analyze")
async def start_process(user_id: str, cv_text: str):
    initial_state = {
        "user_id": user_id,
        "cv_raw_text": cv_text,
        "logs": ["Proceso iniciado por el Orquestador"]
    }
    final_result = await app_graph.ainvoke(initial_state)
    return final_result

@app.get("/")
def root():
    return {"message": "API de IAgentes activa y vinculada al Grafo"}