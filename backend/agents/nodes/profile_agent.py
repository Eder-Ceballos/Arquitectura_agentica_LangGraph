import os
from click import prompt
from langchain_google_genai import ChatGoogleGenerativeAI
from agents.state import AgentState, PerfilNormalizado
from database.database import SessionLocal
from database.profile_repository import guardar_perfil
from dotenv import load_dotenv

load_dotenv()

llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview",   # Modelo original de thomas, sí existe
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0
)

structured_llm = llm.with_structured_output(PerfilNormalizado)



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
        resultado_final = structured_llm.invoke(prompt)

        print("✅ [DEBUG] JSON extraído por Gemini:")
        print(resultado_final)

        # --- Persistencia en BD ---
        db = SessionLocal()
        try:
            guardar_perfil(resultado_final, db)
        finally:
            db.close()
        # --------------------------

        return {
            "perfil_normalizado": resultado_final,
            "status_db": "sync",
            "history": [{
                "agente": "perfil",
                "evento": "extracción_completada",
                "mensaje": f"Perfil de {resultado_final.get('nombre', 'Desconocido')} extraído y guardado en BD."
            }]
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
