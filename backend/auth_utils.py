from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
import os

<<<<<<< HEAD
# Configuración básica
=======
# Configuración
>>>>>>> e5e17e2 (fix: implementar pbkdf2_sha256 y eliminar limite de 72 bytes)
SECRET_KEY = os.getenv("SECRET_KEY", "magneto_token_secret_2024_EAFIT")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 

<<<<<<< HEAD
# Configuramos Passlib para que use el algoritmo bcrypt internamente
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    """
    Usa passlib para hashear. No necesitas recortar manualmente 
    ni generar el salt, passlib lo hace todo por ti.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """
    Compara la clave en texto plano con el hash de la DB.
    """
=======
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
>>>>>>> e5e17e2 (fix: implementar pbkdf2_sha256 y eliminar limite de 72 bytes)
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)