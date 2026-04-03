from typing import List, Optional, TypedDict
from pydantic import BaseModel, Field

# 1. Molde
class PerfilCandidato(BaseModel):
    Id_perfil: int = Field(description="ID numérico único para el perfil")
    nombre: str = Field(description="Nombre completo del candidato")
    telefono: str = Field(description="Número de teléfono de contacto")
    email: str = Field(description="Dirección de correo electrónico")
    profesion: str = Field(description="Título profesional o área de estudio")
    descripcion: str = Field(description="Breve resumen del perfil profesional")
    habilidades: List[str] = Field(description="Lista de habilidades técnicas y blandas")
    años_experiencia: int = Field(description="Años de experiencia total en números")
    sectores: str = Field(description="Sectores de interés (ej: software, informática)")
    cargo: str = Field(description="Cargo actual o último desempeñado")
    salario: float = Field(description="Pretensión salarial o último salario")
    educativo: str = Field(description="Nivel educativo (ej: profesional, técnico)")
    disponibilidad: str = Field(description="Disponibilidad horaria (ej: tiempo completo)")
    discapacidades: str = Field(description="Información sobre discapacidades si aplica")
    ubicacion: str = Field(description="Ciudad y país de residencia")


class AgentState(TypedDict):
    texto_cv: str                 # El texto bruto que saca el pypdf
    perfil_normalizado: PerfilCandidato  # Aquí es donde Gemini guarda el JSON
    current_step: str             # Para que el frontend sepa por dónde vamos
    logs: List[str]               # Historial de lo que ha hecho la IA