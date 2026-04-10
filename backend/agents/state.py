from typing import Annotated, TypedDict, List, Optional, Any
import operator

# --- 1. Estructura de Datos del Candidato ---
class PerfilNormalizado(TypedDict):
    id_perfil: Optional[int]
    nombre: str
    telefono: str
    email: str
    profesion: str
    descripcion: str
    habilidades: List[str]
    años_experiencia: int
    sectores: str
    cargo: str
    salario: float
    educativo: str
    disponibilidad: str
    discapacidades: str
    ubicacion: str

# --- 2. Estructura de Datos de la Empresa ---
class VacanteNormalizada(TypedDict):
    id_vacante: Optional[int]
    cargo: str
    empresa: str
    email: str
    requisitos: List[str]
    descripcion: str
    habilidades: List[str]
    palabras_clave: List[str]

# --- 3. Estructuras de Proceso (Recomendación, Postulación, Seguimiento) ---
class Recomendacion(TypedDict):
    id_vacante: int
    nombre_puesto: str
    empresa: str
    puntuacion: float
    link_detalle: str
    comentario: str
    habilidades_coincidentes: List[str]
    habilidades_faltantes: List[str]

class Postulacion(TypedDict):
    postulacion_id: int
    estado: str

class Seguimiento(TypedDict):
    postulacion_id: int
    fase_actual: str
    estado_visual: str
    mensaje_ia: str
    dias_desde_postulacion: int
    siguiente_paso: str

# --- 4. ESTADO GLOBAL DEL AGENTE (AgentState) ---
class AgentState(TypedDict):
    # INPUTS DIFERENCIADOS
    texto_cv : str
    # El perfil usa HV (PDF) + lo que el usuario escriba en el form
    user_perfil_form: str         
    pdf_file: Any                 # Binarios o ruta de la Hoja de Vida
    
    # La vacante solo usa el texto capturado del formulario de empresa
    user_vacante_form: str        

    # RESULTADOS DE NORMALIZACIÓN
    perfil_normalizado: PerfilNormalizado
    vacante_normalizada: VacanteNormalizada
    
    # CONTROL DE VALIDACIÓN (El "Portero")
    es_valido: bool
    campos_a_corregir: List[str]
    motivo_critico: str
    
    # PERSISTENCIA
    status_db: str                # "sync", "pending", "error"
    
    # PROCESOS DE MATCHING Y CIERRE
    recomendaciones: List[Recomendacion]
    postulacion: Postulacion
    actualizacion: Seguimiento
    
    # TRAZABILIDAD (Se acumula con cada paso)
    history: Annotated[List[dict], operator.add]