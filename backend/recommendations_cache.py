"""
recommendations_cache.py
------------------------
Caché de recomendaciones persistente en disco (JSON).

Ventajas frente al dict in-memory original:
  - Sobrevive reinicios del servidor.
  - Misma TTL de 5 minutos configurable.
  - Thread-safe con bloqueo por archivo.
  - Clave de invalidación por email (compatible con la lógica existente).

Uso:
    from recommendations_cache import recs_cache

    result = recs_cache.get("user@mail.com:7")
    if result is None:
        # ... generar recomendaciones ...
        recs_cache.set("user@mail.com:7", payload)
    recs_cache.invalidate_email("user@mail.com")
"""

import json
import time
import threading
from pathlib import Path

_DEFAULT_TTL = 300          # 5 minutos
_CACHE_FILE = Path(__file__).resolve().parent.parent / "logs" / "recs_cache.json"


class RecommendationsCache:
    """Caché JSON persistente en disco para recomendaciones IA."""

    def __init__(self, ttl: int = _DEFAULT_TTL, filepath: Path = _CACHE_FILE):
        self._ttl = ttl
        self._filepath = filepath
        self._lock = threading.Lock()
        # Aseguramos que el directorio exista
        self._filepath.parent.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Lectura / escritura del archivo JSON
    # ------------------------------------------------------------------

    def _load(self) -> dict:
        if not self._filepath.exists():
            return {}
        try:
            with open(self._filepath, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            return {}

    def _save(self, data: dict) -> None:
        try:
            with open(self._filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
        except OSError:
            pass  # No bloquear el servidor si el disco falla

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------

    def get(self, key: str):
        """Devuelve el payload si existe y no ha expirado; None en caso contrario."""
        with self._lock:
            data = self._load()
            entry = data.get(key)
            if entry is None:
                return None
            if time.time() - entry["ts"] > self._ttl:
                # Entrada expirada: limpiarla
                data.pop(key, None)
                self._save(data)
                return None
            return entry["payload"]

    def set(self, key: str, payload) -> None:
        """Almacena el payload con timestamp actual."""
        with self._lock:
            data = self._load()
            data[key] = {"ts": time.time(), "payload": payload}
            self._save(data)

    def invalidate_email(self, email: str) -> None:
        """Elimina todas las entradas cuya clave empiece por '<email>:'."""
        with self._lock:
            data = self._load()
            keys_to_remove = [k for k in data if k.startswith(f"{email}:")]
            for k in keys_to_remove:
                del data[k]
            if keys_to_remove:
                self._save(data)

    def clear(self) -> None:
        """Vacía la caché por completo."""
        with self._lock:
            self._save({})


# Instancia global que importa main.py
recs_cache = RecommendationsCache()
