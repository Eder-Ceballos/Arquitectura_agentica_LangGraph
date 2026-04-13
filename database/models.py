"""
models.py
---------
Modelos ORM de SQLAlchemy para persistir el PerfilCandidato extraído del CV
y las vacantes estáticas.
"""

from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    ForeignKey, DateTime, Text
)
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()


class Perfil(Base):
    __tablename__ = "perfiles"

    id_perfil = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    email = Column(String, nullable=True, unique=True, index=True)
    profesion = Column(String, nullable=True)
    descripcion = Column(String, nullable=True)
    años_experiencia = Column(Integer, nullable=True)
    sectores = Column(String, nullable=True)
    cargo = Column(String, nullable=True)
    salario = Column(Float, nullable=True)
    educativo = Column(String, nullable=True)
    disponibilidad = Column(String, nullable=True)
    discapacidades = Column(String, nullable=True)
    ubicacion = Column(String, nullable=True)
    is_human_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    habilidades = relationship(
        "Habilidad",
        back_populates="perfil",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Perfil id={self.id_perfil} nombre='{self.nombre}'>"


class Habilidad(Base):
    __tablename__ = "habilidades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_perfil = Column(Integer, ForeignKey("perfiles.id_perfil"), nullable=False, index=True)
    nombre = Column(String, nullable=False)

    perfil = relationship("Perfil", back_populates="habilidades")

    def __repr__(self):
        return f"<Habilidad id_perfil={self.id_perfil} nombre='{self.nombre}'>"


class Vacante(Base):
    __tablename__ = "vacantes"

    id_vacante = Column(String, primary_key=True, index=True)
    cargo = Column(String, nullable=False)
    empresa = Column(String, nullable=False)
    ubicacion = Column(String, nullable=True)
    modalidad = Column(String, nullable=True)
    salario_min = Column(Integer, nullable=True)
    salario_max = Column(Integer, nullable=True)
    habilidades_requeridas = Column(Text, nullable=True)
    experiencia_minima = Column(Integer, nullable=True)
    educacion = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True)
    estado = Column(String, nullable=True)

    def to_dict(self):
        return {
            "id_vacante": self.id_vacante,
            "cargo": self.cargo,
            "empresa": self.empresa,
            "ubicacion": self.ubicacion,
            "modalidad": self.modalidad,
            "salario_min": self.salario_min,
            "salario_max": self.salario_max,
            "habilidades_requeridas": [item.strip() for item in self.habilidades_requeridas.split(",") if item.strip()] if self.habilidades_requeridas else [],
            "experiencia_minima": self.experiencia_minima,
            "educacion": self.educacion,
            "descripcion": self.descripcion,
            "estado": self.estado,
        }

    def __repr__(self):
        return f"<Vacante id_vacante={self.id_vacante} cargo='{self.cargo}'>"
