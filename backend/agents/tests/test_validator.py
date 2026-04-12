# Script rápido de prueba
# Si el archivo es agents/validator.py
from agents.nodes.validator import universal_validator_node
# 1. Simulamos el estado actual (State)
mock_state = {
    "perfil_normalizado": {
        "nombre": "Eder ",
        "email": "eder@eafit.edu.co",
        "habilidades": [], # <--- Esto debería fallar
        "años_experiencia": 1,
	"profesion":"ingeniero de sistemas",
        "ubicacion": "Medellín"
    },
    "history": []
}

# 2. Ejecutamos el nodo manualmente
resultado = universal_validator_node(mock_state, target="profile")

# 3. Verificamos la respuesta de Gemini
print("--- RESULTADO DE LA VALIDACIÓN ---")
print(f"¿Es válido?: {resultado['es_valido']}")
print(f"Campos a corregir: {resultado['campos_a_corregir']}")
print(f"Motivo: {resultado['motivo_critico']}")
print(f"Historial: {resultado['history']}")
