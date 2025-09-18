from fastapi import Request, HTTPException
from scripts.constants.app_constants import TokenConstants, Endpoints
from scripts.utils.cookie_utils import validate_jwt_token
from scripts.logging.log_module import logger as log
import jwt
from scripts.constants.app_configuration import JWT_SECRET_KEY, JWT_ALGORITHM_USED

async def get_current_user(request: Request):
    """
    Dependency for user authentication via JWT token in Authorization header or cookies.
    Returns the user data if authentication is successful.
    Raises HTTPException with 401 status code if authentication fails.
    """
    log.info("Starting authentication check...")
    
    # Check Authorization header first
    auth_header = request.headers.get("Authorization")
    log.info(f"Authorization header: {auth_header}")
    
    # Check cookies as fallback
    cookie_token = request.cookies.get(TokenConstants.access_token)
    log.info(f"Cookie token: {cookie_token[:20] if cookie_token else None}...")
    
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        log.info("Using token from Authorization header")
    elif cookie_token:
        token = cookie_token
        log.info("Using token from cookies")
    else:
        log.error("Authentication token missing from both header and cookies")
        raise HTTPException(status_code=403, detail="Authentication token missing or invalid")
    
    log.info(f"Extracted token: {token[:20]}...")
    
    try:
        # Decode the JWT token directly
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM_USED])
        log.info(f"Decoded payload: {payload}")
        
        # Check if token type matches (JWT has "access", not "access_token")
        if payload.get("type") != "access":
            log.error(f"Token type mismatch. Expected: access, Got: {payload.get('type')}")
            raise HTTPException(status_code=403, detail="Invalid token type")
        
        # Return the user data
        user_data = {
            "email": payload.get("sub"),
            "type": "admin",  # Set type to admin for admin endpoints
            "user_id": payload.get("user_id"),
            "username": payload.get("sub")  # Add username for compatibility
        }
        
        log.info(f"User authenticated successfully {user_data}")
        return user_data
        
    except jwt.ExpiredSignatureError:
        log.error("Token has expired")
        raise HTTPException(status_code=403, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        log.error(f"Invalid token: {str(e)}")
        raise HTTPException(status_code=403, detail="Invalid token")
    except Exception as e:
        log.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication error: {str(e)}")
