from sqlalchemy.orm import Session
from database.models import Vacante


def _serialize_list(value):
    if isinstance(value, list):
        return ", ".join(str(item).strip() for item in value if item is not None)
    if value is None:
        return ""
    return str(value).strip()


def guardar_vacante(vacante: dict, db: Session) -> Vacante:
    id_vacante = vacante.get("id") or vacante.get("id_vacante")
    if not id_vacante:
        raise ValueError("La vacante debe contener un campo 'id' o 'id_vacante'.")

    vacante_existente = db.query(Vacante).filter(Vacante.id_vacante == id_vacante).first()
    if vacante_existente:
        _actualizar_vacante(vacante_existente, vacante)
        vacante_orm = vacante_existente
    else:
        vacante_orm = Vacante(
            id_vacante=id_vacante,
            cargo=vacante.get("cargo", ""),
            empresa=vacante.get("empresa", ""),
            ubicacion=vacante.get("ubicacion", ""),
            modalidad=vacante.get("modalidad", ""),
            salario_min=vacante.get("salario_min", 0),
            salario_max=vacante.get("salario_max", 0),
            habilidades_requeridas=_serialize_list(vacante.get("habilidades_requeridas", [])),
            experiencia_minima=vacante.get("experiencia_minima", 0),
            educacion=vacante.get("educacion", ""),
            descripcion=vacante.get("descripcion", ""),
            estado=vacante.get("estado", "Activa")
        )
        db.add(vacante_orm)
        db.flush()

    db.commit()
    db.refresh(vacante_orm)
    return vacante_orm


def _actualizar_vacante(vacante_orm: Vacante, vacante: dict) -> None:
    vacante_orm.cargo = vacante.get("cargo", vacante_orm.cargo)
    vacante_orm.empresa = vacante.get("empresa", vacante_orm.empresa)
    vacante_orm.ubicacion = vacante.get("ubicacion", vacante_orm.ubicacion)
    vacante_orm.modalidad = vacante.get("modalidad", vacante_orm.modalidad)
    vacante_orm.salario_min = vacante.get("salario_min", vacante_orm.salario_min)
    vacante_orm.salario_max = vacante.get("salario_max", vacante_orm.salario_max)
    vacante_orm.habilidades_requeridas = _serialize_list(vacante.get("habilidades_requeridas", vacante_orm.habilidades_requeridas))
    vacante_orm.experiencia_minima = vacante.get("experiencia_minima", vacante_orm.experiencia_minima)
    vacante_orm.educacion = vacante.get("educacion", vacante_orm.educacion)
    vacante_orm.descripcion = vacante.get("descripcion", vacante_orm.descripcion)
    vacante_orm.estado = vacante.get("estado", vacante_orm.estado)


def obtener_todas_las_vacantes(db: Session) -> list[Vacante]:
    return db.query(Vacante).all()


def obtener_vacante_por_id(id_vacante: str, db: Session) -> Vacante | None:
    return db.query(Vacante).filter(Vacante.id_vacante == id_vacante).first()
