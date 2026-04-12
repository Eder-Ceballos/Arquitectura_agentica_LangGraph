from typing import Literal
from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes.profile_agent import profile_node
from .nodes.validator import universal_validator_node
from .tests.mocks.mock_profile import mock_profile_node
from .tests.mocks.mock_validador import mock_validator_node

def should_continue(state: AgentState) -> Literal["finalizar", "detener"]:
    if state.get("es_valido"):
        return "finalizar"
    return "detener"

def create_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("profile_analyzer", mock_profile_node)
    workflow.add_node("validator", mock_validator_node)

    workflow.set_entry_point("profile_analyzer")
    workflow.add_edge("profile_analyzer", "validator")

    workflow.add_conditional_edges(
        "validator",
        should_continue,
        {
            "finalizar": END,
            "detener": END
        }
    )

    return workflow.compile()

app_graph = create_graph()