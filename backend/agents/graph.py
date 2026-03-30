from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes.profile_agent import profile_node
from .nodes.vacancy_agent import vacancy_node
# ... importar los demás nodos

def create_graph():
    workflow = StateGraph(AgentState)

    # Añadir los 5 agentes como nodos
    workflow.add_node("profile_analyzer", profile_node)
    workflow.add_node("vacancy_scraper", vacancy_node)
    # ... añadir advisor, application y tracker

    # Definir las conexiones (Aristas)
    workflow.set_entry_point("profile_analyzer")
    workflow.add_edge("profile_analyzer", "vacancy_scraper")
    # ... definir el resto del camino hacia END

    return workflow.compile()

# Agente Base compilado listo para ser usado por el Orquestador (FastAPI)
app_graph = create_graph()
