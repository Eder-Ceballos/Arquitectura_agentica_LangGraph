import os
import re
from pypdf import PdfReader
from pypdf.errors import PdfReadError
import docx

def clean_extracted_text(text: str) -> str:
    """
    Limpia el texto extraído para ahorrar tokens en el LLM 
    y evitar ruido en el procesamiento del Agente.
    """
    if not text:
        return ""
    
    # Reemplazar múltiples espacios, tabulaciones o saltos de línea por un solo espacio
    text = re.sub(r'\s+', ' ', text)
    # Eliminar caracteres nulos que a veces aparecen en PDFs corruptos
    text = text.replace('\x00', '')
    
    return text.strip()

def _extract_from_pdf(file_path: str) -> str:
    """Extrae texto de un archivo PDF manejando posibles bloqueos."""
    try:
        reader = PdfReader(file_path)
        
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        return " ".join(extracted_text)
    
    
    except Exception as e:
        raise RuntimeError(f"Error inesperado al procesar el PDF: {str(e)}")

def _extract_from_docx(file_path: str) -> str:
    """Extrae texto de un archivo DOCX leyendo sus párrafos."""
    try:
        doc = docx.Document(file_path)
        # Extraemos solo los párrafos que realmente contienen texto (ignoramos vacíos)
        extracted_text = [para.text for para in doc.paragraphs if para.text.strip()]
        return " ".join(extracted_text)
    except Exception as e:
        raise ValueError(f"El archivo DOCX está corrupto o no se puede procesar: {str(e)}")



def parse_cv(file_path: str) -> str:
    """
    Punto de entrada principal para la herramienta.
    Detecta la extensión, extrae el texto bruto y lo devuelve limpio.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"El archivo referenciado no existe en el storage: {file_path}")

    _, extension = os.path.splitext(file_path.lower())
    
    if extension == '.pdf':
        raw_text = _extract_from_pdf(file_path)
    elif extension == '.docx':
        raw_text = _extract_from_docx(file_path)
    else:
        raise ValueError(f"Extensión no soportada: '{extension}'. Solo se permite .pdf y .docx")

    # Filtro final de limpieza antes de entregar al Grafo
    return clean_extracted_text(raw_text)

# =================================================================
# NUEVA SECCIÓN: INICIALIZADOR DEL ESTADO DE LANGGRAPH
# =================================================================

def get_initial_state(file_path: str) -> dict:
    """
    Extrae el texto del archivo y construye el estado inicial 
    exacto que requiere el nuevo AgentState.
    """
    # 1. Usamos tu función existente para sacar el texto limpio
    texto_limpio = parse_cv(file_path)
    
    # 2. Construimos el "maletín" con TODAS las llaves obligatorias del nuevo state.py
    # Esto evita que LangGraph lance errores de "Missing Key" al iniciar.
    estado_inicial = {
        "user_perfil_form": "",          # Vacío porque la info viene del PDF
        "pdf_file": texto_limpio,        # ¡Aquí enviamos el texto extraído!
        "user_vacante_form": "",         # Vacío, no aplica para candidatos
        
        "perfil_normalizado": {},        # Diccionario vacío, el Agente de Perfil lo llenará
        "vacante_normalizada": {},       # Vacío
        
        "es_valido": True,               # Asumimos que es válido hasta que el validador lo revise
        "campos_a_corregir": [],
        "motivo_critico": "",
        
        "status_db": "pending",          # Estado inicial para persistencia
        
        "recomendaciones": [],
        "postulacion": {},
        "actualizacion": {},
        
        "history": []                    # Lista vacía lista para el operator.add
    }
    
    return estado_inicial