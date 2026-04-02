from langgraph.graph import StateGraph
from agents.state import AgentState
from agents.nodes.validator import universal_validator_node

# Inicializar grafo
workflow = StateGraph(AgentState)

# Crear los nodos reutilizando la función universal
workflow.add_node("validador_candidato", lambda state: universal_validator_node(state, target="profile"))
workflow.add_node("validador_empresa", lambda state: universal_validator_node(state, target="job"))

