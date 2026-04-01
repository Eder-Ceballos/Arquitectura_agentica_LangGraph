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
        
        if reader.is_encrypted:
            raise ValueError("El PDF está protegido con contraseña. Pide al usuario un archivo sin cifrar.")
        
        extracted_text = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                extracted_text.append(text)
                
        return " ".join(extracted_text)
    
    except PdfReadError:
        raise ValueError("El archivo PDF está corrupto o no tiene un formato legible.")
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