import os
import re
import time
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from agents.logger import log_agent_action

load_dotenv()

AGENTE = "agente_recomendaciones"

llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.5,
)


def generar_razones_batch(perfil: dict, ranking_items: list, run_id: str = "rec") -> list:
    """Generates recommendation reasons for multiple vacancies in a single Gemini call."""
    nombre = perfil.get("nombre", "el candidato")
    habilidades_str = ", ".join(perfil.get("habilidades", [])) or "No especificadas"

    vacantes_lines = ""
    for i, item in enumerate(ranking_items, 1):
        match = item["breakdown"]["habilidades_match"]
        match_str = ", ".join(match) if match else "ninguna registrada"
        vacantes_lines += (
            f"\nVACANTE {i}: {item['cargo']} en {item['empresa']} ({item['score']}% compatibilidad)\n"
            f"  - Habilidades en común: {match_str}\n"
            f"  - Puntaje experiencia: {item['breakdown']['experiencia']}/30 pts\n"
        )

    n = len(ranking_items)
    numbered_format = "\n".join(f"{i}. [razón para vacante {i}]" for i in range(1, n + 1))

    prompt = f"""Eres un asesor de empleo en Magneto. El candidato {nombre} tiene el siguiente perfil:
- Profesión: {perfil.get('profesion', 'No especificada')}
- Años de experiencia: {perfil.get('años_experiencia', 0)}
- Habilidades: {habilidades_str}

Para cada vacante a continuación, escribe EXACTAMENTE 1-2 frases explicando por qué es una buena recomendación. Sé específico: menciona habilidades en común y experiencia cuando sea relevante. No uses saludos ni formato adicional.
{vacantes_lines}
Responde ÚNICAMENTE en este formato numerado, sin texto adicional, en español:
{numbered_format}"""

    t0 = time.time()
    try:
        respuesta = llm.invoke(prompt)
        duracion = int((time.time() - t0) * 1000)
        log_agent_action(
            run_id=run_id, agente=AGENTE, evento="razones_generadas",
            mensaje=f"Razones generadas en batch para {n} vacantes", duracion_ms=duracion,
        )

        text = respuesta.content.strip()
        razones = _parse_numbered_list(text, n)
        return razones

    except Exception as e:
        duracion = int((time.time() - t0) * 1000)
        log_agent_action(
            run_id=run_id, agente=AGENTE, evento="error_razones",
            nivel="ERROR", mensaje=str(e), duracion_ms=duracion,
        )
        return _fallback_reasons(ranking_items)


def _parse_numbered_list(text: str, expected: int) -> list:
    lines = text.strip().split("\n")
    razones = []
    current_parts = []

    for line in lines:
        stripped = line.strip()
        if re.match(r"^\d+\.", stripped):
            if current_parts:
                razones.append(" ".join(current_parts).strip())
            cleaned = re.sub(r"^\d+\.\s*", "", stripped)
            current_parts = [cleaned] if cleaned else []
        elif stripped and current_parts:
            current_parts.append(stripped)

    if current_parts:
        razones.append(" ".join(current_parts).strip())

    # Fill missing with empty string; caller handles fallback
    while len(razones) < expected:
        razones.append("")

    return razones[:expected]


def _fallback_reasons(ranking_items: list) -> list:
    reasons = []
    for item in ranking_items:
        match = item["breakdown"]["habilidades_match"]
        match_text = f"Coincides en habilidades como {', '.join(match[:3])}." if match else ""
        reasons.append(
            f"Esta vacante tiene un {item['score']}% de compatibilidad con tu perfil. {match_text}".strip()
        )
    return reasons
