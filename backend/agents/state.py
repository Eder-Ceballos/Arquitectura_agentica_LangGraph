from typing import TypedDict, Annotated, List, Optional
import operator

class AgentState(TypedDict):
    # Datos de entrada
    user_id: str
    cv_raw_text: Optional[str]
    job_url: Optional[str]
    
    # Información procesada por los agentes
    cv_structured_data: dict  # Llenado por profile_agent
    vacancy_data: dict        # Llenado por vacancy_agent
    match_analysis: dict      # Llenado por advisor_agent
    application_status: str   # Llenado por application_agent
    
    # Memoria del flujo (Para el tracker_agent)
    # Annotated permite que los logs se acumulen en lugar de sobrescribirse
    logs: Annotated[List[str], operator.add]
    current_step: str
