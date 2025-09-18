@echo off
REM GoatFinance Development Environment Setup Script for Windows
REM This script sets up and runs both frontend and backend in separate terminals

setlocal enabledelayedexpansion

echo.
echo [INFO] Starting GoatFinance Development Environment...

REM Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
set "BACKEND_DIR=%SCRIPT_DIR%GoatFinance"

echo [INFO] Frontend Directory: %FRONTEND_DIR%
echo [INFO] Backend Directory: %BACKEND_DIR%

REM Check if directories exist
if not exist "%FRONTEND_DIR%" (
    echo [ERROR] Frontend directory not found: %FRONTEND_DIR%
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%" (
    echo [ERROR] Backend directory not found: %BACKEND_DIR%
    pause
    exit /b 1
)

REM Check prerequisites
echo [INFO] Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm first.
    pause
    exit /b 1
)

where python3 >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python3 is not installed. Please install Python3 first.
    pause
    exit /b 1
)

echo [SUCCESS] All prerequisites are installed!

REM Setup Frontend
echo.
echo [INFO] Setting up frontend...
cd /d "%FRONTEND_DIR%"

if not exist "package.json" (
    echo [ERROR] package.json not found in frontend directory
    pause
    exit /b 1
)

echo [INFO] Installing frontend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Frontend dependencies installed successfully!

echo [INFO] Fixing npm security vulnerabilities...
call npm audit fix --force
if %errorlevel% neq 0 (
    echo [WARNING] Some npm vulnerabilities could not be automatically fixed
    echo [WARNING] You may need to manually review and update dependencies
)

REM Setup Backend
echo.
echo [INFO] Setting up backend...
cd /d "%BACKEND_DIR%"

if not exist "requirements.txt" (
    echo [ERROR] requirements.txt not found in backend directory
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python3 virtual environment...
    python3 -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created successfully!
) else (
    echo [INFO] Virtual environment already exists
)

REM Check if activation script exists
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment activation script not found
    echo [INFO] Attempting to recreate virtual environment...
    rmdir /s /q venv
    python3 -m venv venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to recreate virtual environment
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment recreated successfully!
)

REM Activate virtual environment and install dependencies
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Upgrade pip
echo [INFO] Upgrading pip...
python3 -m pip install --upgrade pip

REM Install requirements
echo [INFO] Installing backend dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo [SUCCESS] Backend dependencies installed successfully!

REM Setup complete
echo.
echo [SUCCESS] === Setup Complete! ===
echo [INFO] Starting development servers...

REM Start Frontend in new command prompt
echo [INFO] Starting frontend server...
start "GoatFinance Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Backend in new command prompt
echo [INFO] Starting backend server...
start "GoatFinance Backend" cmd /k "cd /d "%BACKEND_DIR%" && venv\Scripts\activate.bat && uvicorn app:app --reload"

echo.
echo [SUCCESS] === Development Environment Started! ===
echo [INFO] Frontend: http://localhost:9002
echo [INFO] Backend: http://localhost:8000
echo.
echo [INFO] Two new command prompt windows have been opened:
echo [INFO] - One for the frontend server (Next.js)
echo [INFO] - One for the backend server (FastAPI)
echo.
echo [INFO] To stop the servers, close the respective command prompt windows or press Ctrl+C in each window.
echo [INFO] Script execution completed!
echo.
pause
