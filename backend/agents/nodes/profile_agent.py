import os
import sys
from pathlib import Path
from click import prompt
from langchain_google_genai import ChatGoogleGenerativeAI
from agents.state import AgentState, PerfilNormalizado

ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = Path(__file__).resolve().parents[2]
for path in [str(ROOT_DIR), str(BACKEND_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

from database.database import SessionLocal
from database.profile_repository import guardar_perfil
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-light",   # Modelo original de thomas, sí existe
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0
)

structured_llm = llm.with_structured_output(PerfilNormalizado)

PLACEHOLDER_VALUES = {
    "-", "--", "n/a", "na", "none", "sin datos", "no aplica", "desconocido",
    "desconocida", "ninguno", "no hay", "sin información"
}

REQUIRED_PROFILE_KEYS = [
    "nombre", "telefono", "email", "profesion", "descripcion", "habilidades",
    "años_experiencia", "sectores", "cargo", "salario", "educativo",
    "disponibilidad", "discapacidades", "ubicacion"
]


def _is_blank_value(value):
    if value is None:
        return True
    if isinstance(value, str):
        token = value.strip().lower()
        return token == "" or token in PLACEHOLDER_VALUES
    if isinstance(value, list):
        return all(_is_blank_value(item) for item in value)
    return False


def _clean_string(value):
    if _is_blank_value(value):
        return ""
    return str(value).strip()


def _clean_habilidades(value):
    if isinstance(value, list):
        cleaned = [str(item).strip() for item in value if not _is_blank_value(item)]
        return [item for item in cleaned if item]
    if isinstance(value, str):
        if _is_blank_value(value):
            return []
        parts = [part.strip() for part in value.split(",") if part.strip()]
        return [part for part in parts if not _is_blank_value(part)]
    return []


def _to_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _normalize_profile_data(raw_data):
    if not isinstance(raw_data, dict):
        raw_data = {}

    perfil = {}
    for key in REQUIRED_PROFILE_KEYS:
        if key == "habilidades":
            perfil[key] = _clean_habilidades(raw_data.get(key, []))
        elif key == "años_experiencia":
            perfil[key] = _to_int(raw_data.get(key))
        elif key == "salario":
            perfil[key] = _to_float(raw_data.get(key))
        else:
            perfil[key] = _clean_string(raw_data.get(key))

    return perfil


def _has_meaningful_profile(perfil):
    if not isinstance(perfil, dict):
        return False
    return any(
        bool(_clean_string(perfil.get(key)))
        for key in ["nombre", "email", "profesion", "cargo"]
    ) or bool(perfil.get("habilidades"))


def profile_node(state: AgentState):
    print("[Agente de Perfil] Analizando texto del CV ...")

    texto_cv = state.get("pdf_file", "")

    prompt = f"""
    Actúa como un experto en reclutamiento IT. 
    Analiza el siguiente texto extraído de un currículum y organiza la información 
    siguiendo estrictamente el esquema proporcionado.
    
    TEXTO DEL CV:
    {texto_cv}
    """

    try:
        resultado_raw = structured_llm.invoke(prompt)
        resultado_final = _normalize_profile_data(resultado_raw)

        print("✅ [DEBUG] Perfil extraído y normalizado:")
        print(resultado_final)

        if _has_meaningful_profile(resultado_final):
            db = SessionLocal()
            try:
                guardar_perfil(resultado_final, db)
            finally:
                db.close()
            history = [{
                "agente": "perfil",
                "evento": "extracción_completada",
                "mensaje": f"Perfil de {resultado_final.get('nombre', 'Desconocido')} extraído y guardado en BD."
            }]
        else:
            print("⚠️ Perfil sin datos significativos: no se guarda en BD.")
            history = [{
                "agente": "perfil",
                "evento": "extracción_incompleta",
                "mensaje": "El CV no contenía datos significativos y no se persistió."
            }]

        return {
            "perfil_normalizado": resultado_final,
            "status_db": "sync" if _has_meaningful_profile(resultado_final) else "pending",
            "history": history
        }

    except Exception as e:
        print(f"❌ Error durante la llamada a Gemini: {e}")
        return {
            "status_db": "error",
            "history": [{
                "agente": "perfil",
                "evento": "error_ia",
                "detalle": str(e)
            }]
        }
