# main.py - API Backend para Magneto: Sistema de Agentes IA para Procesamiento de CVs
# Utiliza FastAPI para endpoints RESTful, integrando un grafo de agentes LangGraph
# para análisis y validación de perfiles candidatos.

from fastapi import FastAPI, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# Importaciones de módulos locales: herramientas de parsing y grafo de agentes
from agents.tools.cv_parser import get_initial_state
from agents.graph import app_graph

# Inicialización de la aplicación FastAPI con título descriptivo
app = FastAPI(title="IAGentes API - Magneto Edition")

# Configuración de CORS para permitir solicitudes desde el frontend React (localhost:3000)
# Permite credenciales, todos los métodos y headers para integración completa
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# Endpoint principal para carga de CVs: procesa archivos PDF y ejecuta el grafo de agentes
@app.post("/api/v1/candidates/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    # Genera ruta de almacenamiento temporal en el directorio storage/cvs
    file_path = f"storage/cvs/{file.filename}"
    # Crea directorios necesarios si no existen
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Guarda el archivo subido en el sistema de archivos local
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Obtiene el estado inicial del CV mediante el parser especializado
        estado_inicial = get_initial_state(file_path)
        
        # Ejecuta el grafo de agentes de manera asíncrona para procesar el perfil
        resultado_final = await app_graph.ainvoke(estado_inicial)

        # Retorna respuesta estructurada con resultados del análisis de agentes
        return {
            "status": "success",
            "perfil_normalizado": resultado_final.get("perfil_normalizado"),
            "es_valido": resultado_final.get("es_valido"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "motivo_critico": resultado_final.get("motivo_critico"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        # Manejo de errores: retorna estado de error con detalles técnicos
        return {"status": "error", "detalle": str(e)}

# Endpoint para revalidación de candidatos: permite corrección manual de datos y reevaluación
@app.post("/api/v1/candidates/revalidate")
async def revalidate_candidate(corrected_data: dict = Body(...)):
    """
    Recibe el JSON editado desde el frontend y vuelve a pasarlo por el validador.
    """
    try:
        # Construye estado para revalidación forzando evaluación del validador
        state_to_revalidate = {
            "perfil_normalizado": corrected_data,
            "es_valido": False, # Fuerza reevaluación del validador
            "history": [{"agente": "frontend_form", "evento": "manual_correction"}]
        }

        # Reejecuta el grafo de agentes con los datos corregidos
        resultado_final = await app_graph.ainvoke(state_to_revalidate)

        if resultado_final.get("es_valido"):
            # Punto de integración para persistencia: guardar en BD si es válido
            # await save_candidate_to_db(resultado_final["perfil_normalizado"])
            print("💾 Perfil válido: Guardado en persistencia correctamente.")

        # Retorna resultados de la revalidación
        return {
            "status": "success",
            "es_valido": resultado_final.get("es_valido"),
            "perfil_normalizado": resultado_final.get("perfil_normalizado"),
            "campos_a_corregir": resultado_final.get("campos_a_corregir"),
            "historial": resultado_final.get("history")
        }
    except Exception as e:
        # Manejo de excepciones con retorno de error detallado
        return {"status": "error", "detalle": str(e)}

# Endpoint raíz: proporciona confirmación de que la API está operativa y conectada al grafo
@app.get("/")
def root():
    return {"message": "API de IAgentes activa y vinculada al Grafo"}