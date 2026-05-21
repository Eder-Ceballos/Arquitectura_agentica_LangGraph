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
        is_human_verified=False,
        password_hash=perfil.get("password_hash")
        
    )


def _str_val(value) -> str | None:
    """Devuelve el valor limpio si no es cadena vacía/placeholder; None en caso contrario."""
    if value is None:
        return None
    cleaned = str(value).strip()
    if cleaned in {"", "-", "--", "n/a", "na", "none", "sin datos", "no aplica"}:
        return None
    return cleaned


def _actualizar_campos(perfil_orm: Perfil, perfil: dict) -> None:
    """Actualiza únicamente los campos que vienen con valor real (no vacíos ni placeholders).
    Los campos numéricos (años_experiencia, salario) se actualizan solo si el nuevo valor
    no es None; 0 es un valor válido para ambos."""

    # Campos de texto: solo actualizar si el nuevo valor no es vacío
    for attr, key in [
        ("nombre",         "nombre"),
        ("telefono",       "telefono"),
        ("email",          "email"),
        ("profesion",      "profesion"),
        ("descripcion",    "descripcion"),
        ("sectores",       "sectores"),
        ("cargo",          "cargo"),
        ("educativo",      "educativo"),
        ("disponibilidad", "disponibilidad"),
        ("discapacidades", "discapacidades"),
        ("ubicacion",      "ubicacion"),
    ]:
        nuevo = _str_val(perfil.get(key))
        if nuevo is not None:
            setattr(perfil_orm, attr, nuevo)

    # Campos numéricos: actualizar solo si la clave existe en el dict y no es None
    if perfil.get("años_experiencia") is not None:
        try:
            perfil_orm.años_experiencia = int(float(perfil["años_experiencia"]))
        except (TypeError, ValueError):
            pass

    if perfil.get("salario") is not None:
        try:
            perfil_orm.salario = float(perfil["salario"])
        except (TypeError, ValueError):
            pass

    # Contraseña: solo actualizar si viene un hash real
    if perfil.get("password_hash"):
        perfil_orm.password_hash = perfil["password_hash"]


def _sincronizar_habilidades(perfil_orm: Perfil, habilidades_nuevas: list, db: Session) -> None:
    db.query(Habilidad).filter(Habilidad.id_perfil == perfil_orm.id_perfil).delete()
    for nombre_habilidad in habilidades_nuevas:
        db.add(Habilidad(id_perfil=perfil_orm.id_perfil, nombre=str(nombre_habilidad).strip()))
