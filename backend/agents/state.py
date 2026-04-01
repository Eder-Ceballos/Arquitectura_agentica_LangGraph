from typing import TypedDict, Annotated, List, Optional
import operator

class AgentState(TypedDict):
    # Identificación y Archivos
    user_id: str
    file_id: Optional[str]      # ID único del archivo en el storage
    file_path: Optional[str]    # Ruta para que el parser sepa qué leer
    
    # Datos de entrada
    cv_raw_text: Optional[str]
    job_url: Optional[str]
    
    # Información procesada por los agentes
    cv_structured_data: dict    # Llenado por profile_agent
    vacancy_data: dict          # Llenado por vacancy_agent
    match_analysis: dict        # Llenado por advisor_agent
    application_status: str     # Llenado por application_agent
    
    # Observabilidad y Control
    # Annotated + operator.add permite que los logs se acumulen
    logs: Annotated[List[str], operator.add]
    current_step: str           # Ej: "parsing", "profiling", "matching"
    is_busy: bool               # Para control de estado en el frontend