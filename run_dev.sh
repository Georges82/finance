#!/bin/bash

# GoatFinance Development Environment Setup Script
# This script sets up and runs both frontend and backend in separate terminals

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/GoatFinance"

print_status "Starting GoatFinance Development Environment..."
print_status "Frontend Directory: $FRONTEND_DIR"
print_status "Backend Directory: $BACKEND_DIR"

# Check if directories exist
if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists python3; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

print_success "All prerequisites are installed!"

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    cd "$FRONTEND_DIR" || {
        print_error "Failed to navigate to frontend directory: $FRONTEND_DIR"
        return 1
    }
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in frontend directory"
        return 1
    fi
    
    print_status "Installing frontend dependencies..."
    if npm install; then
        print_success "Frontend dependencies installed successfully!"
        
        # Fix npm vulnerabilities
        print_status "Fixing npm security vulnerabilities..."
        npm audit fix --force || {
            print_warning "Some npm vulnerabilities could not be automatically fixed"
            print_warning "You may need to manually review and update dependencies"
        }
        
        return 0
    else
        print_error "Failed to install frontend dependencies"
        return 1
    fi
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    cd "$BACKEND_DIR" || {
        print_error "Failed to navigate to backend directory: $BACKEND_DIR"
        return 1
    }
    
    if [ ! -f "requirements.txt" ]; then
        print_error "requirements.txt not found in backend directory"
        return 1
    fi
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        if python3 -m venv venv; then
            print_success "Virtual environment created successfully!"
        else
            print_error "Failed to create virtual environment"
            return 1
        fi
    else
        print_status "Virtual environment already exists"
    fi
    
    # Check if activation script exists
    if [ ! -f "venv/bin/activate" ]; then
        print_error "Virtual environment activation script not found at: $BACKEND_DIR/venv/bin/activate"
        print_status "Attempting to recreate virtual environment..."
        rm -rf venv
        if python3 -m venv venv; then
            print_success "Virtual environment recreated successfully!"
        else
            print_error "Failed to recreate virtual environment"
            return 1
        fi
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate || {
        print_error "Failed to activate virtual environment"
        return 1
    }
    
    # Upgrade pip
    print_status "Upgrading pip..."
    if pip install --upgrade pip; then
        print_success "Pip upgraded successfully!"
    else
        print_warning "Failed to upgrade pip, continuing with current version"
    fi
    
    # Install requirements
    print_status "Installing backend dependencies..."
    if pip install -r requirements.txt; then
        print_success "Backend dependencies installed successfully!"
        return 0
    else
        print_error "Failed to install backend dependencies"
        return 1
    fi
}

# Function to run frontend in new terminal
run_frontend() {
    print_status "Starting frontend server..."
    
    # Detect terminal application and open new window/tab
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript <<EOF
tell application "Terminal"
    do script "cd '$FRONTEND_DIR' && npm run dev"
    activate
end tell
EOF
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists gnome-terminal; then
            gnome-terminal --tab --title="Frontend" -- bash -c "cd '$FRONTEND_DIR' && npm run dev; exec bash"
        elif command_exists xterm; then
            xterm -title "Frontend" -e "cd '$FRONTEND_DIR' && npm run dev; bash" &
        else
            print_warning "Could not detect terminal. Please run 'cd $FRONTEND_DIR && npm run dev' manually in a new terminal."
        fi
    else
        print_warning "Unsupported OS. Please run 'cd $FRONTEND_DIR && npm run dev' manually in a new terminal."
    fi
}

# Function to run backend in new terminal
run_backend() {
    print_status "Starting backend server..."
    
    # Detect terminal application and open new window/tab
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript <<EOF
tell application "Terminal"
    do script "cd '$BACKEND_DIR' && source venv/bin/activate && uvicorn app:app --reload"
    activate
end tell
EOF
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists gnome-terminal; then
            gnome-terminal --tab --title="Backend" -- bash -c "cd '$BACKEND_DIR' && source venv/bin/activate && uvicorn app:app --reload; exec bash"
        elif command_exists xterm; then
            xterm -title "Backend" -e "cd '$BACKEND_DIR' && source venv/bin/activate && uvicorn app:app --reload; bash" &
        else
            print_warning "Could not detect terminal. Please run the backend manually in a new terminal:"
            print_warning "cd $BACKEND_DIR && source venv/bin/activate && uvicorn app:app --reload"
        fi
    else
        print_warning "Unsupported OS. Please run the backend manually in a new terminal:"
        print_warning "cd $BACKEND_DIR && source venv/bin/activate && uvicorn app:app --reload"
    fi
}

# Main execution
main() {
    print_status "=== GoatFinance Development Setup ==="
    
    # Return to script directory to ensure we're in the right place
    cd "$SCRIPT_DIR" || {
        print_error "Failed to return to script directory: $SCRIPT_DIR"
        exit 1
    }
    
    # Setup frontend
    if setup_frontend; then
        print_success "Frontend setup completed!"
    else
        print_error "Frontend setup failed!"
        exit 1
    fi
    
    # Return to script directory
    cd "$SCRIPT_DIR"
    
    # Setup backend
    if setup_backend; then
        print_success "Backend setup completed!"
    else
        print_error "Backend setup failed!"
        exit 1
    fi
    
    print_success "=== Setup Complete! ==="
    print_status "Starting development servers..."
    
    # Wait a moment
    sleep 1
    
    # Start both servers
    run_frontend
    sleep 2  # Give frontend time to start
    run_backend
    
    print_success "=== Development Environment Started! ==="
    print_status "Frontend: http://localhost:9002"
    print_status "Backend: http://localhost:8000"
    print_status ""
    print_status "To stop the servers, close the terminal windows or press Ctrl+C in each terminal."
    print_status "Script execution completed!"
}

# Run main function
main
