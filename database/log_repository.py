"""
log_repository.py
-----------------
CRUD para la tabla agent_logs. Centraliza toda la persistencia de trazabilidad.
Cualquier agente nuevo solo necesita llamar a guardar_log() con su nombre.
"""

from datetime import datetime, timezone
from typing import Dict, List
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session
from database.models import AgentLog


def guardar_log(data: dict, db: Session) -> AgentLog:
    log = AgentLog(
        run_id=data["run_id"],
        agente=data["agente"],
        evento=data["evento"],
        nivel=data.get("nivel", "INFO"),
        mensaje=data.get("mensaje"),
        detalle=data.get("detalle"),
        duracion_ms=data.get("duracion_ms"),
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def obtener_logs_por_run(run_id: str, db: Session) -> List[AgentLog]:
    return (
        db.query(AgentLog)
        .filter(AgentLog.run_id == run_id)
        .order_by(AgentLog.timestamp)
        .all()
    )


def obtener_logs_recientes(db: Session, limit: int = 50) -> List[AgentLog]:
    return (
        db.query(AgentLog)
        .order_by(AgentLog.timestamp.desc())
        .limit(limit)
        .all()
    )


def obtener_logs_por_agente(agente: str, db: Session, limit: int = 50) -> List[AgentLog]:
    return (
        db.query(AgentLog)
        .filter(AgentLog.agente == agente)
        .order_by(AgentLog.timestamp.desc())
        .limit(limit)
        .all()
    )


def obtener_estado_agentes(db: Session) -> Dict[str, dict]:
    """
    Devuelve el estado actual de cada agente basado en sus logs más recientes.
    Usado por GET /api/v1/agents/status para alimentar el DashboardPage.
    """
    agentes = [row[0] for row in db.query(distinct(AgentLog.agente)).all()]
    hoy = datetime.now(timezone.utc).date()
    resultado = {}

    for agente in agentes:
        ultimo = (
            db.query(AgentLog)
            .filter(AgentLog.agente == agente)
            .order_by(AgentLog.timestamp.desc())
            .first()
        )
        procesados_hoy = (
            db.query(func.count(distinct(AgentLog.run_id)))
            .filter(
                AgentLog.agente == agente,
                AgentLog.evento.contains("completad"),
                func.date(AgentLog.timestamp) == hoy,
            )
            .scalar() or 0
        )
        if ultimo:
            resultado[agente] = {
                "status": _evento_a_status(ultimo.evento, ultimo.nivel),
                "current_action": ultimo.mensaje or ultimo.evento,
                "processed_today": procesados_hoy,
                "last_updated": ultimo.timestamp.isoformat(),
            }

    return resultado


def _evento_a_status(evento: str, nivel: str) -> str:
    if nivel == "ERROR" or "error" in evento:
        return "error"
    if "iniciada" in evento or "iniciado" in evento:
        return "active"
    if "completada" in evento or "completado" in evento:
        return "done"
    return "idle"
