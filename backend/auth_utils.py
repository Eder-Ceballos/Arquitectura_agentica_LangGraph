import os
from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext

# Configuración del motor de hashing (PBKDF2 para evitar líos en Arch)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "tu_clave_secreta_super_segura")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str):
    """Hashea la contraseña usando pbkdf2_sha256."""
    if not password:
        return None
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Verifica la contraseña. Retorna False si el hash es viejo o inválido."""
    if not plain_password or not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        # Esto atrapará el error de "hash could not be identified"
        print(f"Error en verificación (posible hash antiguo): {e}")
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Genera el token JWT para la sesión."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)