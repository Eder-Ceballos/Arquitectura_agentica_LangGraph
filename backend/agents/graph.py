from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes.profile_agent import profile_node
from .nodes.vacancy_agent import vacancy_node

def create_graph():
    workflow = StateGraph(AgentState)

    # Añadir los agentes que tenemos hasta ahora
    workflow.add_node("profile_analyzer", profile_node)
    workflow.add_node("vacancy_scraper", vacancy_node)

    # Definir el flujo: Inicio -> Perfil -> Vacantes -> FIN
    workflow.set_entry_point("profile_analyzer")
    workflow.add_edge("profile_analyzer", "vacancy_scraper")
    workflow.add_edge("vacancy_scraper", END) # <- ESTO FALTABA PARA QUE COMPILE

    return workflow.compile()

# Agente Base compilado listo para ser usado por el Orquestador
app_graph = create_graph()