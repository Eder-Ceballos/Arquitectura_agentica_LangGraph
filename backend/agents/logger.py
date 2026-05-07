"""
logger.py
---------
Módulo central de trazabilidad para los agentes de Magneto.

Uso en cualquier agente nuevo:
    from agents.logger import log_agent_action

    log_agent_action(
        run_id=state["run_id"],
        agente="agente_recomendaciones",   # nombre del agente que lo llama
        evento="matching_iniciado",
        mensaje="Buscando vacantes compatibles con el perfil.",
        nivel="INFO",
        detalle={"total_vacantes": 42},
        duracion_ms=320,
    )
"""

import json
import logging
import sys
from pathlib import Path
from typing import Optional

# ── Directorio de logs ────────────────────────────────────────────────────────
LOGS_DIR = Path(__file__).resolve().parents[1] / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# ── Configuración del logger de Python ───────────────────────────────────────
_logger = logging.getLogger("magneto.agents")

if not _logger.handlers:
    _logger.setLevel(logging.DEBUG)

    fmt = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = logging.FileHandler(LOGS_DIR / "agents.log", encoding="utf-8")
    file_handler.setFormatter(fmt)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(fmt)

    _logger.addHandler(file_handler)
    _logger.addHandler(console_handler)
    _logger.propagate = False


# ── Función pública ───────────────────────────────────────────────────────────

def log_agent_action(
    run_id: str,
    agente: str,
    evento: str,
    mensaje: str,
    nivel: str = "INFO",
    detalle: Optional[dict] = None,
    duracion_ms: Optional[int] = None,
) -> None:
    """
    Registra una acción de agente en archivo de log y en la base de datos.

    Parámetros
    ----------
    run_id      : Identificador único de la ejecución del grafo.
    agente      : Nombre lógico del agente (ej: "agente_perfil").
    evento      : Tipo de acción (ej: "extraccion_completada").
    mensaje     : Descripción legible del evento.
    nivel       : "DEBUG" | "INFO" | "WARNING" | "ERROR"
    detalle     : Dict con contexto adicional (se serializa a JSON).
    duracion_ms : Tiempo de ejecución en milisegundos.
    """
    duracion_str = f" ({duracion_ms}ms)" if duracion_ms is not None else ""
    log_line = f"[{run_id}] [{agente}] {evento}: {mensaje}{duracion_str}"

    log_fn = getattr(_logger, nivel.lower(), _logger.info)
    log_fn(log_line)

    _persist_to_db(run_id, agente, evento, nivel, mensaje, detalle, duracion_ms)


def imprimir_historial(run_id: str, history: list) -> None:
    """
    Imprime en consola y archivo el historial completo de una ejecución del grafo.
    Llamar al finalizar app_graph.ainvoke() para trazabilidad inmediata.
    """
    separador = "=" * 60
    _logger.info(separador)
    _logger.info(f"[{run_id}] HISTORIAL DE EJECUCIÓN — {len(history)} evento(s):")
    for i, evento in enumerate(history, 1):
        _logger.info(f"  [{i}] {json.dumps(evento, ensure_ascii=False)}")
    _logger.info(separador)


def _persist_to_db(
    run_id: str,
    agente: str,
    evento: str,
    nivel: str,
    mensaje: str,
    detalle: Optional[dict],
    duracion_ms: Optional[int],
) -> None:
    try:
        from database.database import SessionLocal
        from database.log_repository import guardar_log

        db = SessionLocal()
        try:
            guardar_log(
                {
                    "run_id": run_id,
                    "agente": agente,
                    "evento": evento,
                    "nivel": nivel,
                    "mensaje": mensaje,
                    "detalle": json.dumps(detalle, ensure_ascii=False) if detalle else None,
                    "duracion_ms": duracion_ms,
                },
                db,
            )
        finally:
            db.close()
    except Exception as exc:
        _logger.error(f"[logger] Error al persistir log en BD: {exc}")
