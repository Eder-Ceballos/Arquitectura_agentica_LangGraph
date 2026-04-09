import os
from langchain_google_genai import ChatGoogleGenerativeAI
from agents.state import AgentState, PerfilNormalizado
from dotenv import load_dotenv

# Cargamos la API KEY del archivo .env
load_dotenv()

# 1. Inicializamos el modelo de Gemini
# Usamos 'gemini-1.5-flash' porque es extremadamente rápido y eficiente 
# para tareas de extracción de datos estructurados.
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0 
)

# 2. Vinculamos el modelo con el "Molde" de Pydantic 
# Esto obliga a Gemini a responder ÚNICAMENTE con el formato JSON dado.
structured_llm = llm.with_structured_output(PerfilNormalizado)

def profile_node(state: AgentState):
    print("🧠 [Agente de Perfil] Analizando texto del CV con Gemini...")

    # Recuperamos el texto extraído por el parser (pypdf)
    texto_cv = state.get("texto_cv", "")

    if not texto_cv:
        print("❌ Error: El texto del CV está vacío.")
        return {"logs": ["Agente de Perfil: Error - No se recibió texto del parser."]}

    # 3. Ejecución de la IA
    # Le damos una instrucción clara para que procese el texto
    prompt = f"""
    Actúa como un experto en reclutamiento IT. 
    Analiza el siguiente texto extraído de un currículum y organiza la información 
    siguiendo estrictamente el esquema proporcionado.
    
    TEXTO DEL CV:
    {texto_cv}
    """

    try:
        # Gemini lee el texto y rellena el JSON
        resultado_final = structured_llm.invoke(prompt)

        # 4. Actualizamos el estado global con los datos reales
        return {
            "perfil_normalizado": resultado_final,
            "current_step": "profiling_completed",
            "logs": [f"Agente de Perfil: Análisis exitoso para {resultado_final.nombre}"]
        }
        
    except Exception as e:
        print(f"❌ Error durante la llamada a Gemini: {e}")
        return {"logs": [f"Agente de Perfil: Error en la IA - {str(e)}"]}