import logging
import logging.handlers
import os
import sys
from logging import StreamHandler
from logging.handlers import RotatingFileHandler
from scripts.constants import app_configuration

# Detect if running in AWS Lambda
RUNNING_IN_LAMBDA = os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

# Set log directory based on environment
if RUNNING_IN_LAMBDA:
    LOG_DIR = "/tmp"  # ✅ AWS Lambda allows writing only to `/tmp/`
else:
    LOG_DIR = app_configuration.LOG_BASE_PATH  # ✅ Local logs

# Ensure log directory exists
os.makedirs(LOG_DIR, exist_ok=True)

# Define log file path
LOG_FILE_PATH = os.path.join(LOG_DIR, "goatfinance.log")

logging.trace = logging.DEBUG - 5
logging.addLevelName(logging.DEBUG - 5, 'TRACE')

class GLensLogger(logging.getLoggerClass()):
    def __init__(self, name):
        super().__init__(name)

    def trace(self, msg, *args, **kwargs):
        if self.isEnabledFor(logging.trace):
            self._log(logging.trace, msg, args, **kwargs)

def get_logger():
    """Sets up logger mechanism"""
    _logger = logging.getLogger("GOATFINANCE")
    _logger.setLevel(app_configuration.LOG_LEVEL)

    # Set log format
    if app_configuration.LOG_LEVEL in ['DEBUG', 'TRACE']:
        _formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(module)s - '
                                       '%(lineno)d - %(message)s')
    else:
        _formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # ✅ File Logging (only in local or if explicitly required)
    if not RUNNING_IN_LAMBDA and 'file' in app_configuration.LOG_HANDLERS:
        _file_handler = logging.FileHandler(LOG_FILE_PATH)
        _file_handler.setFormatter(_formatter)
        _logger.addHandler(_file_handler)

    # ✅ Rotating File Logging (Useful for managing log sizes)
    if 'rotating' in app_configuration.LOG_HANDLERS:
        _rotating_file_handler = RotatingFileHandler(
            filename=LOG_FILE_PATH,
            maxBytes=int(app_configuration.FILE_BACKUP_SIZE),
            backupCount=int(app_configuration.FILE_BACKUP_COUNT)
        )
        _rotating_file_handler.setFormatter(_formatter)
        _logger.addHandler(_rotating_file_handler)

    # ✅ Console Logging (Always enabled for AWS Lambda)
    if 'console' in app_configuration.LOG_HANDLERS or RUNNING_IN_LAMBDA:
        _console_handler = StreamHandler(sys.stdout)
        _console_handler.setFormatter(_formatter)
        _logger.addHandler(_console_handler)

    return _logger

# Initialize logger
logger = get_logger()
