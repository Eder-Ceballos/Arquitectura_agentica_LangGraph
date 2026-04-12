import sys
import os
import asyncio
import json

# --- TRUCO DE RUTAS PARA ARCH LINUX ---
# Añadimos la carpeta 'backend' al path para que encuentre 'utils' y 'agents'
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.abspath(os.path.join(current_dir, "..", "backend"))
sys.path.append(backend_path)

# Ahora sí, los imports funcionarán
from agents.graph import app_graph
from agents.tools.cv_parser import get_initial_state 

async def test_full_flow():
    # 1. Configura la ruta de tu PDF real
    pdf_name = "Eder.pdf" 
    pdf_path = os.path.join(backend_path, "storage", "cvs", pdf_name)

    print(f"🚀 Iniciando prueba para: {pdf_path}")

    try:
        # 2. Obtener estado inicial (Parser)
        state = get_initial_state(pdf_path)
        
        # 3. Ejecutar el Grafo
        print("🧠 Ejecutando agentes...")
        final_state = await app_graph.ainvoke(state)

        # 4. IMPRESIÓN DEL JSON COMPLETO (Lo que pediste)
        print("\n" + "="*50)
        print("💎 PERFIL NORMALIZADO (JSON COMPLETO)")
        print("="*50)
        
        perfil = final_state.get("perfil_normalizado", {})
        # indent=4 para que se vea profesional en tu terminal
        print(json.dumps(perfil, indent=4, ensure_ascii=False))
        
        print("="*50)

        # 5. Verificación de validación
        if final_state.get("es_valido"):
            print("✅ El perfil pasó la validación.")
        else:
            print(f"❌ Perfil inválido: {final_state.get('campos_a_corregir')}")
            print(f"📝 Motivo: {final_state.get('motivo_critico')}")

    except Exception as e:
        print(f"💥 Error en el test: {e}")

if __name__ == "__main__":
    asyncio.run(test_full_flow())