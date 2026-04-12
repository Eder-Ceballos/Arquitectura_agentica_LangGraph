
from agents.state import AgentState


def mock_validator_node(state: AgentState):
    print("⚠️ [DEBUG] Nodo Validador: Verificando datos del Mock")
    
    perfil = state.get("perfil_normalizado", {})
    
    # Verificación de seguridad: nombre y email son los mínimos vitales
    tiene_nombre = bool(perfil.get("nombre"))
    tiene_email = bool(perfil.get("email"))
    
    es_valido = tiene_nombre and tiene_email
    
    if es_valido:
        print("✅ Perfil completo. Redirigiendo a Scraper.")
    else:
        print("❌ Perfil incompleto según el Mock.")

    return {
        "es_valido": es_valido,
        "campos_a_corregir": [] if es_valido else ["nombre", "email"],
        "motivo_critico": "" if es_valido else "Faltan datos esenciales en el objeto mock.",
        "history": state.get("history", []) + [{"agente": "validator_mock", "evento": "validacion_exitosa"}]
    }