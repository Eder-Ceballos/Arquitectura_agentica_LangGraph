import json
from tools.cv_parser import get_initial_state
from agents.nodes.profile_agent import profile_node

def run_test():
    # 1. Ruta a un PDF real que tengas en tu carpeta de storage
    # Cambia 'tu_archivo.pdf' por uno que exista
    pdf_path = "storage/cvs/tu_archivo.pdf" 
    
    print(f"🚀 Iniciando prueba con: {pdf_path}")
    
    try:
        # 2. PASO 1: Probar el Parser e Inicializador
        # Aquí verificamos que el 'maletín' nazca con todas las llaves
        print("\n--- [PASO 1] Ejecutando Parser ---")
        initial_state = get_initial_state(pdf_path)
        
        if not initial_state["pdf_file"]:
            print("❌ ERROR: El parser no extrajo texto del PDF.")
            return

        print("✅ Texto extraído correctamente (primeros 100 caracteres):")
        print(f"'{initial_state['pdf_file'][:100]}...'")

        # 3. PASO 2: Probar el Agente de Perfil
        # Le pasamos el maletín que acaba de crear el parser
        print("\n--- [PASO 2] Ejecutando Agente de Perfil ---")
        final_output = profile_node(initial_state)

        # 4. PASO 3: Verificación de Resultados
        print("\n--- [PASO 3] Resultado Final del Estado ---")
        print(json.dumps(final_output, indent=4, ensure_ascii=False))

    except Exception as e:
        print(f"💥 Error crítico durante la prueba: {e}")

if __name__ == "__main__":
    run_test()
