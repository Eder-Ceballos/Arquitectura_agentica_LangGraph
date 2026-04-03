from typing import Literal
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Mantenemos las rutas de HU-00
from .state import AgentState
from .nodes.profile_agent import profile_node
from .nodes.vacancy_agent import vacancy_node
from agents.nodes.validator import universal_validator_node

# 1. PERSISTENCIA (El cerebro que recuerda en qué paso se quedó Eder)
memory = MemorySaver()

# 2. NODOS DE CONTROL
def nodo_pausa_formulario(state: AgentState):
    """Punto de interrupción. Aquí el backend 'suelta' el control al frontend."""
    return state

# 3. LÓGICA DE RUTEO (El "Checkpost")
def router_validacion(state: AgentState) -> Literal["vacancy_scraper", "pausa_formulario"]:
    """
    Solo si 'es_valido' es True, permitimos el paso a la búsqueda de vacantes.
    De lo contrario, forzamos la parada en el nodo de pausa.
    """
    if state.get("es_valido", False):
        return "vacancy_scraper"
    
    print(f"⚠️ Validación fallida. Campos pendientes: {state.get('campos_a_corregir')}")
    return "pausa_formulario"

# 4. CONSTRUCCIÓN DEL GRAFO
workflow = StateGraph(AgentState)

# Registramos todos los agentes y nodos de control
workflow.add_node("profile_analyzer", profile_node)      # Extracción (HU-00)
workflow.add_node("validacion", lambda state: universal_validator_node(state, target="profile"))
workflow.add_node("pausa_formulario", nodo_pausa_formulario)
workflow.add_node("vacancy_scraper", vacancy_node)      # Siguiente paso (HU-00)

# --- FLUJO LÓGICO DE MAGNETO ---

# Punto de inicio: Analizamos el CV y el form inicial
workflow.set_entry_point("profile_analyzer")

# Del análisis vamos directo a la VALIDACIÓN
workflow.add_edge("profile_analyzer", "validacion")

# El router decide el destino tras validar
workflow.add_conditional_edges(
    "validacion",
    router_validacion,
    {
        "vacancy_scraper": "vacancy_scraper",
        "pausa_formulario": "pausa_formulario"
    }
)

# REENTRADA CRÍTICA: 
# Cuando el usuario envíe el formulario desde React, el flujo 
# NO va a vacantes, sino que VUELVE a validación.
workflow.add_edge("pausa_formulario", "validacion")

# Si todo sale bien y pasa a vacantes, ahí termina el flujo de esta HU
workflow.add_edge("vacancy_scraper", END)

# 5. COMPILACIÓN CON INTERRUPCIÓN
app = workflow.compile(
    checkpointer=memory,
    interrupt_before=["pausa_formulario"] # El grafo se detiene justo aquí
)