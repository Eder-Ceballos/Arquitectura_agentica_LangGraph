import json
import os
import time
from typing import Dict, Any
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from agents.state import AgentState
from agents.logger import log_agent_action

# Cargar variables de entorno
load_dotenv()

# Instanciar el modelo Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0 
)

AGENTE = "agente_perfil"


def universal_validator_node(state: AgentState, target: str = "profile") -> Dict[str, Any]:
    """
    Nodo universal adaptado al nuevo AgentState de Magneto.
    Valida la calidad del 'perfil_normalizado' o la 'vacante_normalizada'.
    """
    run_id = state.get("run_id", "sin-run-id")

    if target == "profile":
        data = state.get("perfil_normalizado")
        display_name = data.get("nombre") if data else None
        contexto_nombre = "Candidato"
    else:
        data = state.get("vacante_normalizada")
        display_name = data.get("cargo") if data else None
        contexto_nombre = "Vacante de Empleo"

    log_agent_action(
        run_id=run_id,
        agente=AGENTE,
        evento="validacion_iniciada",
        mensaje=f"Iniciando validación de {contexto_nombre}: '{display_name or 'sin identificación'}'.",
    )

    if not data or not display_name:
        log_agent_action(
            run_id=run_id,
            agente=AGENTE,
            evento="validacion_sin_datos",
            mensaje="No se encontraron datos iniciales para validar.",
            nivel="WARNING",
        )
        return {
            "es_valido": False,
            "campos_a_corregir": ["Nombre/Cargo", "Habilidades/Requisitos"],
            "history": state.get("history", []) + [{
                "agente": AGENTE,
                "evento": "validacion_sin_datos",
            }],
        }

    habilidades_str = ", ".join(data.get("habilidades", [])) if isinstance(data.get("habilidades"), list) else "No especificadas"

    validation_prompt = f"""
    Eres el experto en calidad de la plataforma Magneto. Analiza los datos de {contexto_nombre}:
    - Identificación: {display_name}
    - Ubicación: {data.get("ubicacion") or data.get("requisitos", "No especificada")}
    - Profesión/Empresa: {data.get("profesion") or data.get("empresa")}
    - Experiencia/Años: {data.get("años_experiencia", "No especificado")}
    - Habilidades Técnicas: {habilidades_str}

    Responde ESTRICTAMENTE en formato JSON:
    {{
        "es_valido": boolean,
        "campos_a_corregir": ["lista de campos faltantes o incompletos"],
        "motivo_critico": "explicación breve"
    }}
    """

    t0 = time.time()
    try:
        response = llm.invoke([HumanMessage(content=validation_prompt)])

        if isinstance(response.content, list):
            text = str(response.content[0].get("text", response.content[0]))
        else:
            text = str(response.content)

        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        result = json.loads(text[start_idx:end_idx])

        es_valido = result.get("es_valido", False)
        duracion = int((time.time() - t0) * 1000)

        log_agent_action(
            run_id=run_id,
            agente=AGENTE,
            evento="validacion_completada",
            mensaje=f"Validación de {contexto_nombre} {'aprobada' if es_valido else 'rechazada'}: {result.get('motivo_critico', '')}",
            nivel="INFO" if es_valido else "WARNING",
            duracion_ms=duracion,
            detalle={
                "es_valido": es_valido,
                "campos_a_corregir": result.get("campos_a_corregir", []),
                "motivo_critico": result.get("motivo_critico", ""),
            },
        )

        return {
            "es_valido": es_valido,
            "campos_a_corregir": result.get("campos_a_corregir", []),
            "motivo_critico": result.get("motivo_critico", ""),
            "history": [{
                "agente": AGENTE,
                "evento": "validacion_completada",
                "es_valido": es_valido,
            }],
        }

    except Exception as e:
        duracion = int((time.time() - t0) * 1000)
        log_agent_action(
            run_id=run_id,
            agente=AGENTE,
            evento="error_validacion",
            mensaje=f"Error en validación de {target}: {e}",
            nivel="ERROR",
            duracion_ms=duracion,
            detalle={"error": str(e)},
        )
        return {
            "es_valido": False,
            "campos_a_corregir": ["Error de conexión con el validador"],
            "motivo_critico": str(e),
            "history": [{"agente": AGENTE, "evento": "error_validacion", "detalle": str(e)}],
        }