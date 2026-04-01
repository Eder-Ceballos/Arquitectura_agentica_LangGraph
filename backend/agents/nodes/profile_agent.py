from agents.state import AgentState

def profile_node(state: AgentState):
    print("🧠 [Agente de Perfil] Analizando texto del CV...")
    
    # Simulamos que hizo algo y actualizamos el estado
    return {
        "current_step": "profiling",
        "logs": ["Agente de Perfil: CV recibido. Simulando extracción de datos..."]
    }