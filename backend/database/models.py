"""
models.py
---------
Modelos ORM de SQLAlchemy para persistir el PerfilCandidato extraído del CV.

Tablas generadas:
  - perfiles   → campos planos del PerfilCandidato
  - habilidades → una fila por habilidad, vinculada a perfiles por id_perfil
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    ForeignKey, DateTime, create_engine
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class Perfil(Base):
    """
    Tabla principal. Mapea directamente los campos planos de PerfilCandidato.
    La columna id_perfil respeta el nombre usado en state.py (Id_perfil).
    """
    __tablename__ = "perfiles"

    # --- Clave primaria ---
    # Usamos el mismo Id_perfil que genera Gemini; si viene None lo autogenera la BD.
    id_perfil = Column(Integer, primary_key=True, index=True)

    # --- Campos de identidad ---
    nombre       = Column(String,  nullable=False)
    telefono     = Column(String,  nullable=True)
    email        = Column(String,  nullable=True, unique=True, index=True)
    profesion    = Column(String,  nullable=True)
    descripcion  = Column(String,  nullable=True)

    # --- Campos laborales ---
    años_experiencia = Column(Integer, nullable=True)
    sectores         = Column(String,  nullable=True)
    cargo            = Column(String,  nullable=True)
    salario          = Column(Float,   nullable=True)

    # --- Campos educativos y personales ---
    educativo      = Column(String, nullable=True)
    disponibilidad = Column(String, nullable=True)
    discapacidades = Column(String, nullable=True)
    ubicacion      = Column(String, nullable=True)

    # --- Trazabilidad y control ---
    is_human_verified = Column(Boolean, default=False, nullable=False)
    created_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                               onupdate=lambda: datetime.now(timezone.utc))

    # --- Relación con habilidades (uno a muchos) ---
    habilidades = relationship(
        "Habilidad",
        back_populates="perfil",
        cascade="all, delete-orphan"   # Si se borra el perfil, se borran sus habilidades
    )

    def __repr__(self):
        return f"<Perfil id={self.id_perfil} nombre='{self.nombre}'>"


class Habilidad(Base):
    """
    Tabla secundaria. Una fila por habilidad del candidato.
    Vinculada a perfiles mediante FK sobre id_perfil.
    """
    __tablename__ = "habilidades"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    id_perfil  = Column(Integer, ForeignKey("perfiles.id_perfil"), nullable=False, index=True)
    nombre     = Column(String, nullable=False)

    # --- Relación inversa ---
    perfil = relationship("Perfil", back_populates="habilidades")

    def __repr__(self):
        return f"<Habilidad id_perfil={self.id_perfil} nombre='{self.nombre}'>"
