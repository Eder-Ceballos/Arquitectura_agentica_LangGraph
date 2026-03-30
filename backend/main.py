from fastapi import FastAPI
from agents.graph import app_graph

app = FastAPI(title="IAGentes API")

@app.post("/analyze")
async def start_process(user_id: str, cv_text: str):
    # Inicializamos el State
    initial_state = {
        "user_id": user_id,
        "cv_raw_text": cv_text,
        "logs": ["Proceso iniciado por el Orquestador"]
    }
    
    # Ejecutamos el Grafo (Agente Base)
    final_result = await app_graph.ainvoke(initial_state)
    return final_result
