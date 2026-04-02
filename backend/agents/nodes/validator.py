import json
import os
from typing import Dict, Any
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from agents.state import AgentState

# Cargar variables de entorno (.env)
load_dotenv()

# Instanciar el modelo que confirmó conexión exitosa
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0 # Temperatura 0 para respuestas deterministas y analíticas
)

def universal_validator_node(state: AgentState, target: str = "profile") -> Dict[str, Any]:
    """
    Nodo universal para validar la calidad de los datos.
    Dependiendo del 'target', valida un Candidato ("profile") o una Empresa ("job").
    """
    
    # 1. Extraer los datos correctos del estado según el objetivo
    data = state.get("extracted_profile") if target == "profile" else state.get("extracted_job")
    
    # Validación temprana por si el agente de extracción falló por completo
    if not data or not getattr(data, 'full_name_or_title', None):
        return {
            f"is_{target}_complete": False,
            f"{target}_missing_fields": ["Nombre/Título principal", "Skills"],
            "requires_human_input": True,
            "history": state.get("history", []) + [{"agent": f"{target}_validator", "status": "failed_no_data"}]
        }

    # 2. Construir el contexto dinámico para la IA
    contexto = "un Candidato" if target == "profile" else "una Vacante de Empleo"
    
    prompt = f"""
    Eres el experto en calidad de la plataforma Magneto. Analiza los datos extraídos de {contexto}:
    - Título/Nombre: {data.full_name_or_title}
    - Ubicación: {data.location}
    - Modalidad: {data.remote_modality}
    - Años de Experiencia: {getattr(data, 'years_of_experience', 'No especificado')}
    - Requisitos/Skills: {", ".join(getattr(data, 'skills_required_or_owned', []))}

    Responde ESTRICTAMENTE en formato JSON, sin texto adicional, markdown, ni firmas de seguridad:
    {{
        "es_valido": boolean,
        "campos_a_corregir": ["lista de campos faltantes, vacíos o ambiguos"],
        "motivo_critico": "string breve explicando por qué es válido o inválido"
    }}
    """

    try:
        # 3. Llamada a Gemini
        response = llm.invoke([HumanMessage(content=prompt)])
        text = response.content
        
        # 4. Limpieza Extrema del JSON
        # Busca el inicio y fin real de la estructura para ignorar el formato ```json y las firmas
        start_idx = text.find('{')
        end_idx = text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise ValueError("La IA no devolvió una estructura JSON reconocible.")
            
        json_str = text[start_idx:end_idx]
        result = json.loads(json_str)
        
        es_valido = result.get("es_valido", False)
        
        # 5. Retornar el parche de estado (State Update)
        return {
            f"is_{target}_complete": es_valido,
            f"{target}_missing_fields": result.get("campos_a_corregir", []),
            "requires_human_input": not es_valido,
            "history": state.get("history", []) + [{
                "agent": f"{target}_validator", 
                "status": "success", 
                "reason": result.get("motivo_critico", "")
            }]
        }
        
    except Exception as e:
        print(f"Error en validación de {target}: {e}")
        # Retorno de seguridad en caso de fallo de conexión o parseo
        return {
            f"is_{target}_complete": False,
            f"{target}_missing_fields": ["Error interno de procesamiento AI"],
            "requires_human_input": True,
            "history": state.get("history", []) + [{"agent": f"{target}_validator", "status": f"error: {str(e)}"}]
        }