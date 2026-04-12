from typing import Literal
from langgraph.graph import StateGraph, END

# Importamos tu Estado y Nodos
from .state import AgentState
from .nodes.profile_agent import profile_node
from .nodes.validator import universal_validator_node
from .tests.mocks.mock_profile import mock_profile_node
from .tests.mocks.mock_validador import mock_validator_node

# --- LÓGICA DEL PORTERO (Enrutador) ---
def should_continue(state: AgentState) -> Literal["buscar_vacantes", "detener"]:
    """
    Decide qué camino tomar después de validar el perfil.
    """
    # Si el validador dijo que está todo OK, seguimos a vacantes.
    if state.get("es_valido"):
        return "buscar_vacantes"
    
    # Si faltan datos, detenemos el grafo aquí para devolver los errores al frontend.
    return "detener"

# --- CONSTRUCCIÓN DEL GRAFO ---
def create_graph():
    workflow = StateGraph(AgentState)

    # 1. Añadir los agentes (Nodos)
    workflow.add_node("profile_analyzer", profile_node)
    #workflow.add_node("profile_analyzer", mock_profile_node)
    
    # Envolvemos el validador para decirle que evalúe el "perfil"
    def validador_perfil(state: AgentState):
        return universal_validator_node(state, target="profile")
        
    workflow.add_node("validator", universal_validator_node)

    # 2. Definir el flujo inicial: Inicio -> Perfil -> Validador
    workflow.set_entry_point("profile_analyzer")
    workflow.add_edge("profile_analyzer", "validator")



    return workflow.compile()

# Agente Base compilado listo para FastAPI
app_graph = create_graph()