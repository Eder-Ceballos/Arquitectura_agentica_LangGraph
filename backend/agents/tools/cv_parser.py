# cv_parser.py - Herramienta de extracción y normalización de texto de CVs
# Implementa parsing de PDFs y DOCX utilizando bibliotecas especializadas (pypdf, python-docx)
# con optimización de texto para reducir consumo de tokens en modelos de lenguaje.

import os
import re
from pypdf import PdfReader
from pypdf.errors import PdfReadError
import docx

# Función de limpieza de texto: normaliza espacios en blanco y elimina caracteres nulos
# para minimizar ruido en el procesamiento de agentes IA y optimizar tokens.
def clean_extracted_text(text: str) -> str:
    if not text:
        return ""

    # Normaliza secuencias de espacios, tabulaciones y saltos de línea a un solo espacio
    text = re.sub(r'\s+', ' ', text)
    # Elimina caracteres nulos comunes en archivos PDF corruptos
    text = text.replace('\x00', '')

    return text.strip()

# Función privada para extracción de texto de PDFs: utiliza PyPDF para iterar páginas
# y extraer texto, manejando excepciones genéricas para robustez.
def _extract_from_pdf(file_path: str) -> str:
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

# Función privada para extracción de texto de DOCX: carga documento con python-docx
# y filtra párrafos no vacíos para evitar texto irrelevante.
def _extract_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        extracted_text = [para.text for para in doc.paragraphs if para.text.strip()]
        return " ".join(extracted_text)
    except Exception as e:
        raise ValueError(f"El archivo DOCX está corrupto o no se puede procesar: {str(e)}")



# Función principal de parsing: valida existencia del archivo, detecta extensión
# y delega extracción a funciones especializadas, aplicando limpieza final.
def parse_cv(file_path: str) -> str:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"El archivo referenciado no existe en el storage: {file_path}")

    _, extension = os.path.splitext(file_path.lower())

    if extension == '.pdf':
        raw_text = _extract_from_pdf(file_path)
    elif extension == '.docx':
        raw_text = _extract_from_docx(file_path)
    else:
        raise ValueError(f"Extensión no soportada: '{extension}'. Solo se permite .pdf y .docx")

    return clean_extracted_text(raw_text)

# Función de inicialización de estado para LangGraph: extrae texto del CV
# y construye diccionario de estado completo con claves obligatorias para evitar errores de inicialización.
def get_initial_state(file_path: str) -> dict:
    texto_limpio = parse_cv(file_path)

    estado_inicial = {
        "user_perfil_form": "",          # Campo vacío: datos provienen del PDF
        "pdf_file": texto_limpio,        # Texto extraído del CV
        "user_vacante_form": "",         # No aplicable para candidatos

        "perfil_normalizado": {},        # Diccionario vacío: poblado por agente de perfil
        "vacante_normalizada": {},       # Vacío

        "es_valido": True,               # Asunción inicial: validado por agente validador
        "campos_a_corregir": [],         # Lista de campos a corregir
        "motivo_critico": "",            # Motivo de invalidez crítica

        "status_db": "pending",          # Estado inicial para operaciones de BD

        "recomendaciones": [],           # Lista de recomendaciones
        "postulacion": {},               # Datos de postulación
        "actualizacion": {},             # Datos de actualización

        "history": []                    # Historial de operaciones: lista para operador add
    }

    return estado_inicial