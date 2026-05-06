from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
import os

# Configuración básica
SECRET_KEY = os.getenv("SECRET_KEY", "magneto_token_secret_2024_EAFIT")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 

# Configuramos Passlib para usar bcrypt internamente
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    """Encripta la contraseña usando Passlib (maneja automáticamente el salt)."""
    # Passlib ya se encarga de los límites de bytes y el hashing seguro
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Verifica la contraseña comparándola con el hash guardado."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_access_token(data: dict):
    """Crea un token JWT para que el frontend pueda autenticarse."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
