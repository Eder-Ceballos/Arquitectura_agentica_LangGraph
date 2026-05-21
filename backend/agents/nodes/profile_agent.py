import json
import os
import sys
import time
from pathlib import Path
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from agents.state import AgentState

ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[2]
for path in [str(ROOT_DIR), str(BACKEND_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

from agents.logger import log_agent_action
from dotenv import load_dotenv

load_dotenv()

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    groq_api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)

PLACEHOLDER_VALUES = {
    "-", "--", "n/a", "na", "none", "sin datos", "no aplica", "desconocido",
    "desconocida", "ninguno", "no hay", "sin información"
}

REQUIRED_PROFILE_KEYS = [
    "nombre", "telefono", "email", "profesion", "descripcion", "habilidades",
    "años_experiencia", "sectores", "cargo", "salario", "educativo",
    "disponibilidad", "discapacidades", "ubicacion"
]


def _is_blank_value(value):
    if value is None:
        return True
    if isinstance(value, str):
        token = value.strip().lower()
        return token == "" or token in PLACEHOLDER_VALUES
    if isinstance(value, list):
        return all(_is_blank_value(item) for item in value)
    return False


def _clean_string(value):
    if _is_blank_value(value):
        return ""
    return str(value).strip()


def _clean_habilidades(value):
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if not _is_blank_value(item)]
        return [item for item in cleaned if item]
    if isinstance(value, str):
        if _is_blank_value(value):
            return []
        parts = [part.strip() for part in value.split(",") if part.strip()]
        return [part for part in parts if not _is_blank_value(part)]
    return []


def _to_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _normalize_profile_data(raw_data):
    if not isinstance(raw_data, dict):
        raw_data = {}

    perfil = {}
    for key in REQUIRED_PROFILE_KEYS:
        if key == "habilidades":
            perfil[key] = _clean_habilidades(raw_data.get(key, []))
        elif key == "años_experiencia":
            perfil[key] = _to_int(raw_data.get(key))
        elif key == "salario":
            perfil[key] = _to_float(raw_data.get(key))
        else:
            perfil[key] = _clean_string(raw_data.get(key))

    return perfil


def _has_meaningful_profile(perfil):
    if not isinstance(perfil, dict):
        return False
    return any(
        bool(_clean_string(perfil.get(key)))
        for key in ["nombre", "email", "profesion", "cargo"]
    ) or bool(perfil.get("habilidades"))


AGENTE = "agente_perfil"


def profile_node(state: AgentState):
    run_id = state.get("run_id", "sin-run-id")
    texto_cv = state.get("pdf_file", "")

    log_agent_action(
        run_id=run_id,
        agente=AGENTE,
        evento="extraccion_iniciada",
        mensaje="Analizando texto del CV con Gemini.",
    )

    extraction_prompt = f"""
Actúa como un experto en reclutamiento IT.
Analiza el siguiente texto extraído de un currículum y extrae la información del candidato.

Responde ESTRICTAMENTE en formato JSON con exactamente estos campos:
{{
    "nombre": "nombre completo del candidato",
    "telefono": "número de teléfono",
    "email": "correo electrónico",
    "profesion": "profesión o título profesional",
    "descripcion": "resumen profesional o descripción",
    "habilidades": ["habilidad1", "habilidad2", "..."],
    "años_experiencia": 0,
    "sectores": "sectores o industrias donde ha trabajado",
    "cargo": "último o principal cargo desempeñado",
    "salario": 0.0,
    "educativo": "nivel educativo más alto alcanzado",
    "disponibilidad": "disponibilidad para trabajar (inmediata, 1 mes, etc.)",
    "discapacidades": "discapacidades si aplica, o vacío",
    "ubicacion": "ciudad y/o país de residencia"
}}

Si algún campo no está disponible en el CV, usa cadena vacía "" para strings, 0 para números y [] para listas.
NO incluyas texto adicional fuera del JSON.

TEXTO DEL CV:
{texto_cv}
"""

    t0 = time.time()
    try:
        response = llm.invoke([HumanMessage(content=extraction_prompt)])

        # Extraer el contenido de texto de la respuesta
        if isinstance(response.content, list):
            text = str(response.content[0].get("text", response.content[0]))
        else:
            text = str(response.content)

        # Parsear JSON manualmente (robusto ante texto extra antes/después del JSON)
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        if start_idx == -1 or end_idx == 0:
            raise ValueError(f"No se encontró JSON válido en la respuesta del modelo. Respuesta: {text[:200]}")

        raw_data = json.loads(text[start_idx:end_idx])
        resultado_final = _normalize_profile_data(raw_data)
        duracion = int((time.time() - t0) * 1000)

        # La persistencia en BD es responsabilidad exclusiva de main.py,
        # que aplica el override del email autenticado ANTES de guardar.
        # El agente solo normaliza y devuelve el perfil al estado del grafo.
        if _has_meaningful_profile(resultado_final):
            log_agent_action(
                run_id=run_id,
                agente=AGENTE,
                evento="extraccion_completada",
                mensaje=f"Perfil de '{resultado_final.get('nombre', 'Desconocido')}' extraído correctamente. Pendiente de persistencia en main.",
                duracion_ms=duracion,
                detalle={"nombre": resultado_final.get("nombre"), "email": resultado_final.get("email")},
            )
            history = [{"agente": AGENTE, "evento": "extraccion_completada"}]
        else:
            log_agent_action(
                run_id=run_id,
                agente=AGENTE,
                evento="extraccion_incompleta",
                mensaje="El CV no contenía datos significativos.",
                nivel="WARNING",
                duracion_ms=duracion,
            )
            history = [{"agente": AGENTE, "evento": "extraccion_incompleta"}]

        return {
            "perfil_normalizado": resultado_final,
            "status_db": "pending",   # main.py actualiza a "sync" al guardar
            "history": history,
        }

    except Exception as e:
        duracion = int((time.time() - t0) * 1000)
        log_agent_action(
            run_id=run_id,
            agente=AGENTE,
            evento="error_extraccion",
            mensaje=f"Error durante la llamada a Gemini: {e}",
            nivel="ERROR",
            duracion_ms=duracion,
            detalle={"error": str(e)},
        )
        return {
            "status_db": "error",
            "history": [{"agente": AGENTE, "evento": "error_extraccion", "detalle": str(e)}],
        }
