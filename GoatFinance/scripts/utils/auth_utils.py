import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from scripts.constants.app_configuration import JWT_SECRET_KEY, JWT_ALGORITHM_USED
from scripts.logging.log_module import logger as log

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        log.error(f"Error hashing password: {e}")
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        log.error(f"Error verifying password: {e}")
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create an access JWT token"""
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(hours=24)
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM_USED)
        return encoded_jwt
    except Exception as e:
        log.error(f"Error creating access token: {e}")
        raise

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a refresh JWT token"""
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM_USED)
        return encoded_jwt
    except Exception as e:
        log.error(f"Error creating refresh token: {e}")
        raise

def convert_db_role_to_enum(role_str: str):
    """Convert database role string to Role enum"""
    from modules.admin_portal_management.models.admin_portal_management_models import Role
    try:
        return Role(role_str.lower())
    except ValueError:
        log.warning(f"Unknown role: {role_str}, defaulting to USER")
        return Role.USER
