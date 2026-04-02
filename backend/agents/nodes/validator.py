import json
import os
from typing import Dict, Any
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from agents.state import AgentState

# Cargar variables de entorno
load_dotenv()

# Instanciar el modelo Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0 
)

def universal_validator_node(state: AgentState, target: str = "profile") -> Dict[str, Any]:
    """
    Nodo universal adaptado al nuevo AgentState de Magneto.
    Valida la calidad del 'perfil_normalizado' o la 'vacante_normalizada'.
    """
    
    # 1. Extraer los datos del nuevo State según el objetivo
    if target == "profile":
        data = state.get("perfil_normalizado")
        display_name = data.get("nombre") if data else None
        contexto_nombre = "Candidato"
    else:
        data = state.get("vacante_normalizada")
        display_name = data.get("cargo") if data else None
        contexto_nombre = "Vacante de Empleo"

    # Validación temprana si el diccionario está vacío o no tiene identificación básica
    if not data or not display_name:
        return {
            "es_valido": False,
            "campos_a_corregir": ["Nombre/Cargo", "Habilidades/Requisitos"],
            "history": state.get("history", []) + [{
                "agent": f"{target}_validator", 
                "status": "failed_no_data",
                "reason": "No se encontraron datos iniciales para validar."
            }]
        }

    # 2. Construir el prompt usando los campos exactos del nuevo State
    # Extraemos skills/habilidades manejando que son listas
    habilidades_str = ", ".join(data.get("habilidades", [])) if isinstance(data.get("habilidades"), list) else "No especificadas"
    
    prompt = f"""
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

    try:
        # 3. Llamada a Gemini
        response = llm.invoke([HumanMessage(content=prompt)])
        text = response.content
        
        # Si 'content' es una lista (sucede en algunas versiones de LangChain/Gemini), 
        # tomamos el texto del primer elemento.
        if isinstance(response.content, list):
            text = str(response.content[0].get("text", response.content[0]))
        else:
            text = str(response.content)

        # 4. Limpieza y Parseo del JSON
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        result = json.loads(text[start_idx:end_idx])
        
        es_valido = result.get("es_valido", False)
        
        # 5. Retornar el parche de estado alineado con state.py
        return {
            "es_valido": es_valido,
            "campos_a_corregir": result.get("campos_a_corregir", []),
            "motivo_critico": result.get("motivo_critico", ""),
            "history": [{ # Gracias a operator.add, esto se sumará a la lista existente
                "agent": f"{target}_validator", 
                "status": "success" if es_valido else "incomplete", 
                "reason": result.get("motivo_critico", "")
            }]
        }
        
    except Exception as e:
        print(f"Error en validación de {target}: {e}")
        return {
            "es_valido": False,
            "campos_a_corregir": ["Error de conexión con el validador"],
            "motivo_critico": str(e),
            "history": [{"agent": f"{target}_validator", "status": "error", "reason": str(e)}]
        }