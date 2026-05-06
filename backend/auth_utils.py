
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
import os
import bcrypt

# Configuración básica
# En el futuro, esto lo moveremos a tu archivo .env
SECRET_KEY = os.getenv("SECRET_KEY", "magneto_token_secret_2024_EAFIT")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440 # El token durará 24 horas

# Configuramos Bcrypt para el hasheo de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    # Recortamos a 72 para evitar el error de bcrypt bytes
    trimmed_password = password[:72]
    pwd_bytes = trimmed_password.encode('utf-8')
    salt = bcrypt.gensalt()
    hash = bcrypt.hashpw(pwd_bytes, salt)
    return hash.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    # También recortamos aquí para que la comparación sea justa
    trimmed_password = plain_password[:72]
    return bcrypt.checkpw(
        trimmed_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )
def create_access_token(data: dict):
    """Crea un token JWT para que el frontend pueda autenticarse."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
