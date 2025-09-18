import os
import json
import jwt
from dotenv import load_dotenv
from jwt import  ExpiredSignatureError, InvalidTokenError
from scripts.logging.log_module import logger as log
from datetime import datetime, timedelta
from scripts.constants.app_constants import TokenConstants, GFTableNames
from scripts.utils.simple_encrytion_utils import AESCipher
from scripts.utils.common_utils import *

load_dotenv(override=True)
from scripts.constants.app_configuration import JWT_SECRET_KEY
AES_SECRET = os.getenv("AES_SECRET", "ApZFCKjwzXdqBR78")

async def create_auth_token(ip: str, email: str, last_login: str=datetime.now().strftime("%Y-%m-%d %H:%M:%S")):
    """
    Create authentication token with AES encrypted email.
    
    :param ip: IP address
    :param email: Email to encrypt
    :param last_login: Last login timestamp
    :return: Token with encrypted email
    """
    try:
        # encrypted_email= encrypt_email(email)
        
        if not email :
            log.error("Failed to encrypt email")
            return None
        
        # Format token with IP, encrypted email, and last login timestamp
        token = f"{ip}${email}${last_login}"
        return token 
    
    except Exception as e:
        log.error(f"Exception Occurred While Creating Auth Token: {str(e)}")
        return None

async def generate_jwt_token(token, type,permissions=None):
    """
    Generate JWT token.
    
    :param token: Token to generate JWT for
    :param type: Type of token
    :return: JWT token
    """
    try:
        expiration_time = datetime.utcnow() + timedelta(seconds=TokenConstants.max_age)
        Encrypt = AESCipher(AES_SECRET)
        encrypted_token = Encrypt.encrypt(token)

        payload = {
            "sub": str(encrypted_token),
            "type": type,
            "exp": expiration_time
        }
        if permissions:
            encrypt_perm= Encrypt.encrypt(permissions)
            payload["per"] = encrypt_perm

        jwt_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
        return jwt_token
    except Exception as e:
        log.error("Exception Occurred While Generating JWT Token: " + str(e))
        return None

async def validate_jwt_token(token: str, token_type: str):
    """
    Validate a JWT token.
    
    :param token: JWT token to validate
    :param token_type: Expected type of token
    :return: Decoded token data or failure response
    """
    final_resp = {"message": "Failed to validate token", "status": "failed", "data": None}
    try:
        db_object_utility = PostgresConnection()
        conn = db_object_utility.connect_to_postgres_utility()
        if not conn:
            log.error("Failed to connect to database")
            return final_resp
        conn.begin_transaction()
        # Decode the JWT token
        generate_new_token= False
        condition = "token=%s"
        is_token_valid = conn.fetch_specified_columns_with_condition(GFTableNames.email_token,["status"] ,condition, params=(token,))
        
        if len(is_token_valid) == 0  or is_token_valid == None:
            log.error("Token not found in database or status is not updated")
            final_resp["message"] = "Token not found or status is not updated"
            conn.rollback_transaction()
            return final_resp
        if is_token_valid[0].get("status") == "updated":
            final_resp["message"] = "Token status is updated"
            generate_new_token = True
        elif is_token_valid[0].get("status") != "active":
            final_resp["message"] = "Token is not active"
            conn.rollback_transaction()
            return final_resp
        
        payload = jwt.decode(token, AUTH_SECRET, algorithms=["HS256"])
        
        # Check if token type matches
        if payload.get("type") != token_type:
            log.warning("Token type mismatch")
            final_resp["message"] = "Token type mismatch"
            conn.rollback_transaction()
            return final_resp

        Encrypt = AESCipher(AES_SECRET)

        token=payload.get("sub", "")

        # Validate 'sub' format (expecting "ip$email$last_login")
        sub_data = Encrypt.decrypt(token)
        log.info(f"Decrypted token data: {sub_data}")
        if not sub_data or "$" not in sub_data:
            raise ValueError("Invalid token format")
        parts = sub_data.split("$")
        log.info(f"Token parts: {parts}")
        ip, email, last_login, tenant_id, enterprise_id, role_id, user_id, is_additional_permission, additional_permission_id, is_enterprise_user, is_active_subscription =  None, None, None, None, None, None, None, None, None, False, False

        if len(parts) == 3:
            log.info("Token has 3 parts: IP, email, last_login")
            ip, email, last_login = parts[0], parts[1], parts[2]
        elif len(parts) == 4:
            log.info("Token has 4 parts: IP, email, last_login, user_id")
            ip, email, last_login, user_id = parts[0], parts[1], parts[2], parts[3]
        elif len(parts) == 5:
            log.info("Token has 5 parts: IP, email, last_login, tenant_id, user_id")
            ip, email, last_login, tenant_id, user_id = parts[0], parts[1], parts[2], parts[3], parts[4]
        
        elif len(parts) == 11:
            log.info("Token has 11 parts: IP, email, last_login, tenant_id, enterprise_id, role_id, user_id, is_additional_permission, additional_permission_id, is_enterprise_user, is_active_subscription")
            ip, email, last_login, tenant_id, enterprise_id, role_id, user_id, is_additional_permission, additional_permission_id, is_enterprise_user, is_active_subscription = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9], parts[10]

        else:
            log.error("Invalid token format")
            raise ValueError("Invalid token format")

        permissions= None
        if payload.get("per"):
            permissions = Encrypt.decrypt(payload.get("per"))
            permissions = json.loads(permissions)

        final_resp["data"] = {"ip": ip, "email": email, "last_login": last_login, "tenant_id": tenant_id, "enterprise_id": enterprise_id, "role_id": role_id, "user_id": user_id, "is_additional_permission": is_additional_permission, "additional_permission_id": additional_permission_id, "permissions": permissions, "generate_new_token": generate_new_token, "is_enterprise_user": is_enterprise_user, "is_active_subscription": is_active_subscription}
        final_resp["message"] = "Token validated successfully!"
        final_resp["status"] = "success"
        conn.commit_transaction()
        return final_resp

    except ExpiredSignatureError:
        log.error("JWT token has expired")
        final_resp["message"] = "Token has expired"
        conn.rollback_transaction()
        return final_resp
    
    except InvalidTokenError:
        log.error("Invalid JWT token")
        final_resp["message"] = "Invalid token"
        conn.rollback_transaction()
        return final_resp

    except Exception as e:
        log.error(f"Exception Occurred While Validating JWT Token: {str(e)}")
        final_resp["message"] = "Failed to validate token"
        conn.rollback_transaction()
        return final_resp
