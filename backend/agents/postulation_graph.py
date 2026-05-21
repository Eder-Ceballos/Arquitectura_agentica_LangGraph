from typing import Annotated, List, Optional, TypedDict
import operator
from langgraph.graph import StateGraph, END
from agents.nodes.application_agent import application_node
from agents.nodes.tracker_agent import tracker_node


class PostulacionState(TypedDict):
    run_id: str
    id_perfil: int
    id_vacante: str
    perfil: dict
    vacante: dict
    score: float
    habilidades_match: List[str]
    postulacion_id: Optional[int]
    estado: str
    mensaje_confirmacion: str
    siguiente_paso: str
    error: Optional[str]
    history: Annotated[List[dict], operator.add]


def should_track(state: PostulacionState) -> str:
    if state.get("error"):
        return "fin"
    return "seguimiento"


def create_postulation_graph():
    workflow = StateGraph(PostulacionState)

    workflow.add_node("aplicar", application_node)
    workflow.add_node("seguimiento", tracker_node)

    workflow.set_entry_point("aplicar")
    workflow.add_conditional_edges(
        "aplicar",
        should_track,
        {"seguimiento": "seguimiento", "fin": END},
    )
    workflow.add_edge("seguimiento", END)

    return workflow.compile()


postulation_graph = create_postulation_graph()
