from sqlalchemy.orm import Session
from database.models import PostulacionDB


def crear_postulacion(id_perfil: int, id_vacante: str, run_id: str, db: Session) -> PostulacionDB:
    postulacion = PostulacionDB(
        id_perfil=id_perfil,
        id_vacante=id_vacante,
        run_id=run_id,
        estado="Enviada",
    )
    db.add(postulacion)
    db.commit()
    db.refresh(postulacion)
    return postulacion


def actualizar_postulacion(id_postulacion: int, campos: dict, db: Session) -> PostulacionDB:
    postulacion = db.query(PostulacionDB).filter(PostulacionDB.id == id_postulacion).first()
    if not postulacion:
        raise ValueError(f"Postulación {id_postulacion} no encontrada")
    for campo, valor in campos.items():
        setattr(postulacion, campo, valor)
    db.commit()
    db.refresh(postulacion)
    return postulacion


def obtener_postulacion_existente(id_perfil: int, id_vacante: str, db: Session) -> PostulacionDB | None:
    return db.query(PostulacionDB).filter(
        PostulacionDB.id_perfil == id_perfil,
        PostulacionDB.id_vacante == id_vacante,
    ).first()


def obtener_postulaciones_por_perfil(id_perfil: int, db: Session) -> list[PostulacionDB]:
    return db.query(PostulacionDB).filter(
        PostulacionDB.id_perfil == id_perfil
    ).order_by(PostulacionDB.fecha_postulacion.desc()).all()


def cancelar_postulacion(id_postulacion: int, id_perfil: int, db: Session) -> bool:
    """Elimina una postulación verificando que pertenezca al perfil indicado.
    Devuelve True si se eliminó, False si no se encontró."""
    postulacion = db.query(PostulacionDB).filter(
        PostulacionDB.id == id_postulacion,
        PostulacionDB.id_perfil == id_perfil,   # seguridad: solo puede cancelar las suyas
    ).first()
    if not postulacion:
        return False
    db.delete(postulacion)
    db.commit()
    return True
