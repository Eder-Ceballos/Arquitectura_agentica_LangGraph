from sqlalchemy.orm import Session
from database.models import Perfil, Habilidad


def _is_valid_email(email: str | None) -> bool:
    if not email or not isinstance(email, str):
        return False
    cleaned = email.strip().lower()
    if cleaned in {"", "-", "--", "n/a", "na", "none", "sin datos", "no aplica"}:
        return False
    return "@" in cleaned and "." in cleaned


def guardar_perfil(perfil: dict, db: Session) -> Perfil:
    id_perfil = perfil.get("id_perfil")
    perfil_existente = None
    if id_perfil:
        perfil_existente = db.query(Perfil).filter(Perfil.id_perfil == id_perfil).first()
    elif _is_valid_email(perfil.get("email")):
        perfil_existente = db.query(Perfil).filter(Perfil.email == perfil.get("email")).first()

    if perfil_existente:
        _actualizar_campos(perfil_existente, perfil)
        perfil_orm = perfil_existente
    else:
        perfil_orm = _dict_a_orm(perfil)
        db.add(perfil_orm)
        db.flush()

    _sincronizar_habilidades(perfil_orm, perfil.get("habilidades", []), db)
    db.commit()
    db.refresh(perfil_orm)
    print(f"✅ Perfil guardado en BD: id={perfil_orm.id_perfil}, nombre='{perfil_orm.nombre}'")
    return perfil_orm


def obtener_perfil(id_perfil: int, db: Session) -> Perfil | None:
    return db.query(Perfil).filter(Perfil.id_perfil == id_perfil).first()


def obtener_todos_los_perfiles(db: Session) -> list[Perfil]:
    return db.query(Perfil).all()


def _dict_a_orm(perfil: dict) -> Perfil:
    email = perfil.get("email")
    if not email or not isinstance(email, str) or email.strip().lower() in {"", "-", "--", "n/a", "na", "none", "sin datos", "no aplica"}:
        email = None

    return Perfil(
        id_perfil=perfil.get("id_perfil"),
        nombre=perfil.get("nombre", ""),
        telefono=perfil.get("telefono", ""),
        email=email,
        profesion=perfil.get("profesion", ""),
        descripcion=perfil.get("descripcion", ""),
        años_experiencia=perfil.get("años_experiencia", 0),
        sectores=perfil.get("sectores", ""),
        cargo=perfil.get("cargo", ""),
        salario=perfil.get("salario", 0.0),
        educativo=perfil.get("educativo", ""),
        disponibilidad=perfil.get("disponibilidad", ""),
        discapacidades=perfil.get("discapacidades", ""),
        ubicacion=perfil.get("ubicacion", ""),
        is_human_verified=False
    )


def _actualizar_campos(perfil_orm: Perfil, perfil: dict) -> None:
    perfil_orm.nombre = perfil.get("nombre", perfil_orm.nombre)
    perfil_orm.telefono = perfil.get("telefono", perfil_orm.telefono)
    perfil_orm.email = perfil.get("email", perfil_orm.email)
    perfil_orm.profesion = perfil.get("profesion", perfil_orm.profesion)
    perfil_orm.descripcion = perfil.get("descripcion", perfil_orm.descripcion)
    perfil_orm.años_experiencia = perfil.get("años_experiencia", perfil_orm.años_experiencia)
    perfil_orm.sectores = perfil.get("sectores", perfil_orm.sectores)
    perfil_orm.cargo = perfil.get("cargo", perfil_orm.cargo)
    perfil_orm.salario = perfil.get("salario", perfil_orm.salario)
    perfil_orm.educativo = perfil.get("educativo", perfil_orm.educativo)
    perfil_orm.disponibilidad = perfil.get("disponibilidad", perfil_orm.disponibilidad)
    perfil_orm.discapacidades = perfil.get("discapacidades", perfil_orm.discapacidades)
    perfil_orm.ubicacion = perfil.get("ubicacion", perfil_orm.ubicacion)


def _sincronizar_habilidades(perfil_orm: Perfil, habilidades_nuevas: list, db: Session) -> None:
    db.query(Habilidad).filter(Habilidad.id_perfil == perfil_orm.id_perfil).delete()
    for nombre_habilidad in habilidades_nuevas:
        db.add(Habilidad(id_perfil=perfil_orm.id_perfil, nombre=str(nombre_habilidad).strip()))
