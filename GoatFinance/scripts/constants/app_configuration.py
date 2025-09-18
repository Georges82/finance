#!/usr/bin/env python
"""This module is for the basic configuration details. All configuration details will be collected from the application.conf and assign to each local variables for common use """

import configparser
import os
import logging
logger = logging.getLogger(__name__)


CONFIGURATION_FILE = "conf/application.conf"
__config = configparser.ConfigParser()
__config.read(CONFIGURATION_FILE)

SERVER_CONFIG_SECTION = "SERVER"
SERVICE_CONFIG_SECTION = "SERVICE"
POSTGRES_CONFIG_SECTION = "POSTGRES"
LOG_CONFIG_SECTION = "LOG"
JWT_CONFIG_SECTION = "JWT"
COOKIE_CONFIG_SECTION = "COOKIE"
SETPASSWORD_CONFIG_SECTION = "SETPASSWORD"
EMAIL_CONFIG_SECTION = "EMAIL"
AUTH_CONFIG_SECTION = "AUTH"

# Server Details
BASE_URL = os.environ.get("BASE_URL", __config.get(SERVER_CONFIG_SECTION, 'base_url'))
PORT = os.environ.get("SERVICE_PORT", __config.get(SERVER_CONFIG_SECTION, 'port'))
HOST = os.environ.get("HOST", __config.get(SERVER_CONFIG_SECTION, 'host'))
WORKERS = int(os.environ.get("WORKERS", __config.get(SERVER_CONFIG_SECTION, 'workers')))

# service
ALLOW_ORIGINS = os.environ.get("ALLOW_ORIGINS", __config.get(SERVICE_CONFIG_SECTION, 'allow_origins').split(","))
SERVER_CAT = os.environ.get("SERVER_CAT", __config.get(SERVICE_CONFIG_SECTION, "server_cat"))
SESSION_TIMEOUT = os.environ.get('session_timeout', __config.get(SERVICE_CONFIG_SECTION, 'session_timeout'))
BASE_CODE_PATH = os.environ.get('base_code_path', __config.get(SERVICE_CONFIG_SECTION, 'base_code_path'))
EMAIL_SECRET_KEY = os.environ.get('email_secret_key', __config.get(SERVICE_CONFIG_SECTION, 'email_secret_key'))

# LOG HANDLERS
LOG_BASE_PATH = os.environ.get("LOG_BASE_PATH", __config.get(LOG_CONFIG_SECTION, 'base_path'))
LOG_LEVEL = os.environ.get("LOG_LEVEL", __config.get(LOG_CONFIG_SECTION, 'level'))
FILE_BACKUP_COUNT = __config.get(LOG_CONFIG_SECTION, 'file_backup_count')
FILE_BACKUP_SIZE = __config.get(LOG_CONFIG_SECTION, 'file_size_mb')
FILE_NAME = LOG_BASE_PATH + __config.get(LOG_CONFIG_SECTION, 'file_name')
LOG_HANDLERS = __config.get(LOG_CONFIG_SECTION, 'handlers')

# Postgres conf
POSTGRES_HOST = os.environ.get("POSTGRES_HOST", __config.get(POSTGRES_CONFIG_SECTION, "postgres_host"))
POSTGRES_PORT = int(os.environ.get("POSTGRES_PORT", __config.get(POSTGRES_CONFIG_SECTION, "postgres_port")))
POSTGRES_USER = os.environ.get("POSTGRES_USER", __config.get(POSTGRES_CONFIG_SECTION, "postgres_user"))
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD", __config.get(POSTGRES_CONFIG_SECTION, "postgres_password"))
POSTGRES_DATABASE = os.environ.get("POSTGRES_DATABASE", __config.get(POSTGRES_CONFIG_SECTION, "postgres_database"))

# jwt
JWT_ALGORITHM_USED = os.environ.get("JWT_ALGORITHM_USED", __config.get(JWT_CONFIG_SECTION, "alogrithm_used"))
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", __config.get(JWT_CONFIG_SECTION, "secret_key"))

# cookie
COOKIE_STR = os.environ.get("COOKIE_STR", __config.get(COOKIE_CONFIG_SECTION, "cookie_str"))
COOKIE_KEY = os.environ.get("COOKIE_KEY", __config.get(COOKIE_CONFIG_SECTION, "cookie_key"))
COOKIE_EXPIRATION_IN_SECONDS = os.environ.get("COOKIE_EXPIRATION_IN_SECONDS",
                                             __config.get(COOKIE_CONFIG_SECTION, "cookie_expire_time_seconds"))
FORGET_COOKIE_STR = os.environ.get("FORGET_COOKIE_STR", __config.get(COOKIE_CONFIG_SECTION, "forget_cookie_str"))
FORGET_COOKIE_EXPIRATION_IN_SECONDS = os.environ.get("COOKIE_EXPIRATION_IN_SECONDS",
                                                    __config.get(COOKIE_CONFIG_SECTION,
                                                               "forget_cookie_expire_time_seconds"))
COOKIE_HTTPONLY = __config.get('COOKIE', "cookie_httponly")
COOKIE_SECURE = __config.get('COOKIE', "cookie_secure")

SET_PASSWORD_COOKIE_EXPIRATION_IN_SECONDS = os.environ.get("SET_PASSWORD_COOKIE_EXPIRATION_IN_SECONDS",
                                                          __config.get(SETPASSWORD_CONFIG_SECTION, "set_password_cookie_expire_time_seconds"))


#VERIFICATION_LINK_BASE_URL = os.environ.get("VERIFICATION_LINK_BASE_URL", __config.get(EMAIL_CONFIG_SECTION, "verification_link_base_url", fallback="https://localhost:8000"))
#END_USER_PORTAL_BASE_URL = os.environ.get("END_USER_PORTAL_BASE_URL", __config.get(EMAIL_CONFIG_SECTION, "end_user_portal_base_url", fallback="https://localhost:8000"))

# Auth Configuration
try:
    # Try to get AUTH_SECRET from environment first
    AUTH_SECRET = os.environ.get("AUTH_SECRET")
    if not AUTH_SECRET:
        # Try to get AUTH_SECRET from the config file
        AUTH_SECRET = __config.get(AUTH_CONFIG_SECTION, "auth_secret", fallback="jwt_secret_of_goatfinance")
        logger.info(f"Using AUTH_SECRET from config file or default: {AUTH_SECRET}")
    else:
        logger.info(f"Using AUTH_SECRET from environment: {AUTH_SECRET}")
except Exception as e:
    logger.error(f"Error loading AUTH_SECRET configuration: {str(e)}")
    # Fallback to hardcoded default as a last resort
    AUTH_SECRET = "jwt_secret_of_goatfinance"
    logger.warning(f"Using fallback hardcoded AUTH_SECRET value: {AUTH_SECRET}")
AES_SECRET = os.environ.get("AES_SECRET", __config.get(AUTH_CONFIG_SECTION, "aes_secret", fallback="ApZFCKjwzXdqBR78"))
