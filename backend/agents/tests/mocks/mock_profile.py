from agents.state import AgentState

def mock_profile_node(state: AgentState):
    print("⚠️ [DEBUG] Nodo Analizador: Generando datos completos desde el Mock")
    
    # Si el perfil ya tiene nombre, significa que viene de una edición manual o ya fue procesado
    if state.get("perfil_normalizado") and state["perfil_normalizado"].get("nombre"):
        print("⏭️ Analizador: Datos detectados en el estado, saltando mock.")
        return state

    # ... tu lógica de generación de mock actual si el estado está vacío ...
    # El objeto exacto que solicitaste
    resultado_mock = {
        "id_perfil": 12,
        "nombre": "",
        "telefono": 312678654,
        "email": "eder@wder.cd",
        "profesion": "",
        "descripcion": "fasdfasfasdfasdfeafas",
        "habilidades": ["python", "sql", "docker"],
        "años_experiencia": 3,
        "sectores": "awefafasdfasef",
        "cargo": "ingeniero de software",
        "salario": "2000.000",
        "educativo": "universitario",
        "disponibilidad": "immediata",
        "discapacidades": "ninguna",
        "ubicacion": "medellin"
    }

    # Retornamos solo el perfil y el historial. 
    # NO retornamos es_valido aquí para respetar la lógica de agentes.
    return {
        "perfil_normalizado": resultado_mock,
        "history": state.get("history", []) + [{
            "agente": "perfil_mock", 
            "evento": "extraccion_completa",
            "mensaje": "Se han cargado los datos de prueba predefinidos."
        }]
    }