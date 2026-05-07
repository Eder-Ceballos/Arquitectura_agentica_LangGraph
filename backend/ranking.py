from database.models import Vacante


def calcular_ranking(perfil: dict, vacantes: list[Vacante]) -> list[dict]:
    resultados = []
    for vacante in vacantes:
        score, breakdown = _score_vacante(perfil, vacante)
        resultados.append({
            "id_vacante": vacante.id_vacante,
            "cargo": vacante.cargo,
            "empresa": vacante.empresa,
            "ubicacion": vacante.ubicacion,
            "modalidad": vacante.modalidad,
            "salario_min": vacante.salario_min,
            "salario_max": vacante.salario_max,
            "score": score,
            "breakdown": breakdown,
        })
    return sorted(resultados, key=lambda x: x["score"], reverse=True)


def _score_vacante(perfil: dict, vacante: Vacante) -> tuple[float, dict]:
    # Skills (40%)
    habs_candidato = {h.lower().strip() for h in perfil.get("habilidades", [])}
    habs_vacante_str = vacante.habilidades_requeridas or ""
    habs_vacante = {h.strip().lower() for h in habs_vacante_str.split(",") if h.strip()}

    if habs_vacante:
        match_ratio = len(habs_candidato & habs_vacante) / len(habs_vacante)
        skill_score = round(match_ratio * 40, 1)
        habilidades_match = list(habs_candidato & habs_vacante)
    else:
        skill_score = 20.0
        habilidades_match = []

    # Experiencia (30%)
    años = int(perfil.get("años_experiencia") or 0)
    min_exp = int(vacante.experiencia_minima or 0)
    if min_exp == 0:
        exp_score = 30.0
    elif años >= min_exp:
        exp_score = 30.0
    else:
        exp_score = round((años / min_exp) * 30, 1)

    # Salario (20%)
    salario = float(perfil.get("salario") or 0)
    sal_min = float(vacante.salario_min or 0)
    sal_max = float(vacante.salario_max or 0)

    if salario == 0 or (sal_min == 0 and sal_max == 0):
        sal_score = 10.0
    elif sal_min <= salario <= sal_max:
        sal_score = 20.0
    elif salario < sal_min:
        sal_score = round((salario / sal_min) * 20, 1) if sal_min > 0 else 10.0
    else:
        excess_ratio = (salario - sal_max) / sal_max if sal_max > 0 else 0
        sal_score = round(max(0.0, 20.0 - excess_ratio * 20), 1)

    # Ubicación (10%)
    ub_candidato = (perfil.get("ubicacion") or "").lower().strip()
    ub_vacante = (vacante.ubicacion or "").lower().strip()
    if not ub_candidato or not ub_vacante:
        loc_score = 5.0
    elif ub_candidato == ub_vacante:
        loc_score = 10.0
    else:
        loc_score = 0.0

    total = round(skill_score + exp_score + sal_score + loc_score, 1)
    return total, {
        "habilidades": skill_score,
        "experiencia": exp_score,
        "salario": sal_score,
        "ubicacion": loc_score,
        "habilidades_match": habilidades_match,
    }
