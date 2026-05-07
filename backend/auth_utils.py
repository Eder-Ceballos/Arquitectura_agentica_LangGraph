from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
import os

# Configuración
SECRET_KEY = os.getenv("SECRET_KEY", "magneto_token_secret_2024_EAFIT")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# FORZAMOS el uso de pbkdf2_sha256.
# Es igual de seguro que bcrypt pero NO tiene el límite de 72 bytes
# y es mucho más estable para trabajar en equipo.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str):
    """Hashea la contraseña sin límites de longitud."""
    if not password:
        return None
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Verifica la contraseña."""
    if not plain_password or not hashed_password:
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
