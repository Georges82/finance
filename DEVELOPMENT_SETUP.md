# GoatFinance Development Environment Setup

This guide explains how to set up and run the GoatFinance application in development mode using the provided scripts.

## Prerequisites

Before running the development environment, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Python 3** (v3.8 or higher) - [Download here](https://python.org/)
- **Git** (optional, for version control)

## Quick Start

### For macOS/Linux Users

1. **Make the script executable:**
   ```bash
   chmod +x run_dev.sh
   ```

2. **Run the development environment:**
   ```bash
   ./run_dev.sh
   ```

### For Windows Users

1. **Run the batch script:**
   ```cmd
   run_dev.bat
   ```

## What the Scripts Do

The scripts automatically handle the following tasks:

### Frontend Setup (Next.js)
1. Navigate to the `frontend` directory
2. Install all npm dependencies (`npm install`)
3. Start the development server (`npm run dev`)
4. Frontend runs on: **http://localhost:9002**

### Backend Setup (FastAPI)
1. Navigate to the `GoatFinance` directory
2. Create a Python virtual environment (if it doesn't exist)
3. Activate the virtual environment
4. Upgrade pip to the latest version
5. Install all Python dependencies from `requirements.txt`
6. Start the FastAPI server (`uvicorn app:app --reload`)
7. Backend runs on: **http://localhost:8000**

## Manual Setup (Alternative)

If you prefer to set up the environment manually:

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd GoatFinance
python3 -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate.bat

pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --reload
```

## Application URLs

Once both servers are running:

- **Frontend (Next.js)**: http://localhost:9002
- **Backend API (FastAPI)**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc

## Stopping the Servers

### Using Scripts
- The scripts open separate terminal windows/tabs for each server
- To stop a server, close its respective terminal window or press `Ctrl+C` in the terminal

### Manual Stop
- Press `Ctrl+C` in each terminal where the servers are running

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Frontend (port 9002): Stop any existing Next.js applications
   - Backend (port 8000): Stop any existing FastAPI/uvicorn processes

2. **Python virtual environment issues:**
   - The script automatically detects and recreates corrupted virtual environments
   - If issues persist, manually delete the `venv` folder and run the script again
   - Ensure Python 3 is properly installed and accessible

3. **Node.js dependency issues:**
   - The script automatically runs `npm audit fix --force` to resolve security vulnerabilities
   - If issues persist, delete `node_modules` folder and `package-lock.json`, then run the script again

4. **Permission denied (macOS/Linux):**
   - Make sure the script is executable: `chmod +x run_dev.sh`

5. **Virtual environment activation fails:**
   - The script automatically detects missing activation scripts and recreates the environment
   - Ensure you have proper write permissions in the project directory

### Checking Prerequisites

You can verify your installations with these commands:

```bash
node --version
npm --version
python3 --version  # or python --version on Windows
```

## Development Workflow

1. **Start Development**: Run the appropriate script for your OS
2. **Frontend Development**: Make changes in the `frontend` directory
   - Hot reload is enabled, changes appear automatically
3. **Backend Development**: Make changes in the `GoatFinance` directory
   - Server restarts automatically with `--reload` flag
4. **API Testing**: Use the Swagger UI at http://localhost:8000/docs

## Project Structure

```
GoatFinance/
├── frontend/                 # Next.js React application
│   ├── src/
│   ├── package.json
│   └── ...
├── GoatFinance/             # FastAPI Python backend
│   ├── app.py              # Main FastAPI application
│   ├── requirements.txt    # Python dependencies
│   ├── venv/              # Virtual environment (created by script)
│   └── ...
├── run_dev.sh             # macOS/Linux setup script
├── run_dev.bat            # Windows setup script
└── DEVELOPMENT_SETUP.md   # This file
```

## Additional Notes

- The backend includes CORS middleware configured for both development ports
- The virtual environment is created locally in the `GoatFinance` directory
- All dependencies are installed automatically by the scripts
- The scripts include error checking and colored output for better user experience

## Need Help?

If you encounter any issues:

1. Check that all prerequisites are installed correctly
2. Ensure no other applications are using ports 8000 or 9002
3. Try running the manual setup commands to identify specific issues
4. Check the terminal output for detailed error messages

Happy coding! 🚀
