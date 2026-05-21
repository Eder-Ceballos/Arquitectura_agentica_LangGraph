"""
advisor_agent.py
----------------
Nodo LangGraph del Agente Asesor (advisor).

Responsabilidad:
    Dado un perfil de candidato y un listado de vacantes rankeadas,
    invoca recommendation_agent.generar_razones_batch() para producir
    explicaciones IA de por qué cada vacante es una buena opción.

Uso en el grafo de recomendaciones (recomendation_graph):
    workflow.add_node("advisor", advisor_node)

También puede ser invocado directamente desde cualquier endpoint que
necesite recomendaciones enriquecidas:
    from agents.nodes.advisor_agent import advisor_node
"""

import uuid
from agents.nodes.recommendation_agent import generar_razones_batch
from agents.logger import log_agent_action

AGENTE = "agente_recomendaciones"


def advisor_node(state: dict) -> dict:
    """
    Nodo LangGraph del agente asesor.

    Entradas esperadas en state:
        - perfil  (dict): datos del candidato (nombre, profesion, habilidades, etc.)
        - ranking (list): lista de vacantes ya puntuadas por ranking.calcular_ranking()
        - run_id  (str):  identificador de la ejecución del grafo.

    Salida:
        - recomendaciones (list): mismos items del ranking con campo 'razon' añadido.
    """
    run_id = state.get("run_id") or str(uuid.uuid4())
    perfil = state.get("perfil", {})
    ranking = state.get("ranking", [])

    log_agent_action(
        run_id=run_id,
        agente=AGENTE,
        evento="asesor_iniciado",
        mensaje=f"Generando razones IA para {len(ranking)} vacantes del candidato '{perfil.get('nombre', '?')}'.",
    )

    if not ranking:
        log_agent_action(
            run_id=run_id,
            agente=AGENTE,
            evento="asesor_sin_vacantes",
            mensaje="No hay vacantes rankeadas para generar recomendaciones.",
            nivel="WARNING",
        )
        return {
            "recomendaciones": [],
            "history": [{"agente": AGENTE, "evento": "asesor_sin_vacantes"}],
        }

    razones = generar_razones_batch(perfil, ranking, run_id)

    recomendaciones = [
        {
            **item,
            "razon": razon or f"{item['score']}% de compatibilidad con tu perfil.",
        }
        for item, razon in zip(ranking, razones)
    ]

    log_agent_action(
        run_id=run_id,
        agente=AGENTE,
        evento="asesor_completado",
        mensaje=f"Recomendaciones generadas exitosamente para {len(recomendaciones)} vacantes.",
        detalle={"total": len(recomendaciones)},
    )

    return {
        "recomendaciones": recomendaciones,
        "history": [{"agente": AGENTE, "evento": "asesor_completado"}],
    }
