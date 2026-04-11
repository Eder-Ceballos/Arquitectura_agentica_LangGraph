from agents.state import AgentState

def vacancy_node(state: AgentState):
    print("🔍 [Agente de Vacantes] Buscando empleos...")
    
    # Simulamos que hizo algo y actualizamos el estado
    return {
        "current_step": "vacancy_search",
        "logs": ["Agente de Vacantes: Simulando búsqueda de vacantes..."]
    }