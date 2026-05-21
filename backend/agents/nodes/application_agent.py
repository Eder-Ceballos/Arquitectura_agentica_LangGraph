import os
import json
import time
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from database.database import SessionLocal
from database.postulacion_repository import (
    crear_postulacion, obtener_postulacion_existente, actualizar_postulacion
)
from agents.logger import log_agent_action

load_dotenv()

AGENTE = "agente_postulaciones"

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.4,
)


def application_node(state: dict) -> dict:
    run_id = state.get("run_id", "sin-run-id")
    id_perfil = state.get("id_perfil")
    id_vacante = state.get("id_vacante")
    perfil = state.get("perfil", {})
    vacante = state.get("vacante", {})

    log_agent_action(run_id=run_id, agente=AGENTE, evento="postulacion_iniciada",
                     mensaje=f"Procesando postulación de perfil {id_perfil} a vacante {id_vacante}.")

    db = SessionLocal()
    try:
        existente = obtener_postulacion_existente(id_perfil, id_vacante, db)
        if existente:
            log_agent_action(run_id=run_id, agente=AGENTE, evento="postulacion_duplicada",
                             nivel="WARNING", mensaje="El candidato ya había postulado a esta vacante.")
            return {
                "error": "Ya postulaste a esta vacante anteriormente.",
                "postulacion_id": existente.id,
                "estado": existente.estado,
                "mensaje_confirmacion": existente.mensaje_confirmacion,
                "siguiente_paso": existente.siguiente_paso,
                "history": [{"agente": AGENTE, "evento": "postulacion_duplicada"}],
            }
        postulacion = crear_postulacion(id_perfil, id_vacante, run_id, db)
    finally:
        db.close()

    habilidades_str = ", ".join(perfil.get("habilidades", [])) or "No especificadas"
    habilidades_req = ", ".join(vacante.get("habilidades_requeridas", [])) or "No especificadas"
    score = state.get("score", 0)
    match_str = ", ".join(state.get("habilidades_match", [])) or "ninguna en común"

    # Single Gemini call: returns both confirmation message and next-step advice as JSON
    prompt = f"""Eres un asistente de reclutamiento de Magneto.
El candidato {perfil.get('nombre', 'el candidato')} postuló a {vacante.get('cargo', 'cargo')} en {vacante.get('empresa', 'la empresa')}.
Compatibilidad: {score}% | Habilidades en común: {match_str}
Perfil: {perfil.get('profesion', 'No especificada')}, {perfil.get('años_experiencia', 0)} años de experiencia.
Sus habilidades: {habilidades_str}
La vacante requiere: {habilidades_req}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra):
{{
  "mensaje": "<confirmación personalizada y motivadora, máximo 3 oraciones, menciona por qué su perfil es relevante>",
  "siguiente_paso": "<consejo práctico y específico de 1-2 oraciones para aumentar sus posibilidades>"
}}"""

    t0 = time.time()
    mensaje = ""
    siguiente_paso = ""
    try:
        respuesta = llm.invoke(prompt)
        duracion = int((time.time() - t0) * 1000)

        raw = respuesta.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw.strip())
        mensaje = parsed.get("mensaje", "").strip()
        siguiente_paso = parsed.get("siguiente_paso", "").strip()

        log_agent_action(run_id=run_id, agente=AGENTE, evento="postulacion_confirmada",
                         mensaje=f"Postulación {postulacion.id} creada. Mensaje y siguiente paso generados en una sola llamada.",
                         duracion_ms=duracion)

    except Exception as e:
        duracion = int((time.time() - t0) * 1000)
        log_agent_action(run_id=run_id, agente=AGENTE, evento="error_confirmacion",
                         nivel="ERROR", mensaje=str(e), duracion_ms=duracion)

    if not mensaje:
        mensaje = f"Tu postulación a {vacante.get('cargo')} en {vacante.get('empresa')} fue enviada exitosamente."
    if not siguiente_paso:
        siguiente_paso = "Revisa tu perfil y asegúrate de que tus habilidades estén actualizadas."

    db = SessionLocal()
    try:
        actualizar_postulacion(postulacion.id, {
            "mensaje_confirmacion": mensaje,
            "siguiente_paso": siguiente_paso,
        }, db)
    finally:
        db.close()

    return {
        "postulacion_id": postulacion.id,
        "estado": "Enviada",
        "mensaje_confirmacion": mensaje,
        "siguiente_paso": siguiente_paso,
        "history": [{"agente": AGENTE, "evento": "postulacion_confirmada"}],
    }
