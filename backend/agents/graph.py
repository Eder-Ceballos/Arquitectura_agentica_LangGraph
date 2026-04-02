from typing import Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from agents.state import AgentState
from agents.nodes.validator import universal_validator_node
# Importar los stubs o interfaces de tus compañeros
# from agents.nodes.extractor import extraer_perfil_node 
# from agents.nodes.persistence import guardar_perfil_db_node

# 1. PERSISTENCIA DE ESTADO (Checkpointer)
# Esto es lo que permite que el grafo "duerma" mientras el usuario llena el form
memory = MemorySaver()

# 2. NODOS DE INTERFAZ (Stubs para tus compañeros)
def nodo_extractor_wrapper(state: AgentState):
    # Aquí irá la lógica de tu compañero. Por ahora es un "passthrough"
    print("--- EJECUTANDO EXTRACCIÓN ---")
    return state

def nodo_persistencia_wrapper(state: AgentState):
    # Aquí irá la lógica de base de datos
    print("--- GUARDANDO EN BASE DE DATOS ---")
    return state

def nodo_pausa_formulario(state: AgentState):
    """
    Nodo de interrupción. No hace nada, solo marca el punto de pausa.
    """
    return state

# 3. LÓGICA DE RUTEO (Conditional Edge)
def router_validacion(state: AgentState) -> Literal["persistencia", "pausa_formulario"]:
    """
    Decide el camino basándose en el booleano 'es_valido' que generó Gemini.
    """
    if state.get("es_valido", False):
        return "persistencia"
    return "pausa_formulario"

# 4. CONSTRUCCIÓN DEL GRAFO
workflow = StateGraph(AgentState)

# Añadir Nodos
workflow.add_node("extraccion", nodo_extractor_wrapper)
workflow.add_node("validacion", lambda state: universal_validator_node(state, target="profile"))
workflow.add_node("pausa_formulario", nodo_pausa_formulario)
workflow.add_node("persistencia", nodo_persistencia_wrapper)

# Definir Flujo
workflow.set_entry_point("extraccion")
workflow.add_edge("extraccion", "validacion")

# El gran "Portero" (Arista condicional)
workflow.add_conditional_edges(
    "validacion",
    router_validacion,
    {
        "persistencia": "persistencia",
        "pausa_formulario": "pausa_formulario"
    }
)

# Reentrada: Cuando el usuario corrija, volvemos a validar
workflow.add_edge("pausa_formulario", "validacion")

# Fin del flujo de perfil
workflow.add_edge("persistencia", END)

# 5. COMPILACIÓN DEFINITIVA
# 'interrupt_before' es la clave para que el backend suelte el control al frontend
app = workflow.compile(
    checkpointer=memory,
    interrupt_before=["pausa_formulario"]
)

