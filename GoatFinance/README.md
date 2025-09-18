# **GOAT FINANCE Module (FastAPI + PostgreSQL)**  

This project is a **GOAT FINANCE module** built with **FastAPI**, using **PostgreSQL** as the database and deployed on **Windows Machine** .

---

## **🚀 Features**
- ✅ **FastAPI** for handling GOAT finance services  
- ✅ **PostgreSQL** for data storage (using `psycopg`)   
- ✅ **CORS Middleware** for secure cross-origin requests  
- ✅ **Logging & Exception Handling Middleware**  
- ✅ **Docker** support for local development and testing
- ✅ **Pytest** for comprehensive API testing

---

## **📂 Project Structure**
Goatfinance-AdminModule/
│── app.py                    # FastAPI Application (Entry Point)
│── locustfile.py            # Load testing configuration
│── requirements.txt         # Python dependencies
│── .env                     # Environment variables
│── .gitignore              # Git ignore rules
│── README.md               # Project Documentation
│── Dockerfile              # Dockerfile for main application
│── Dockerfile.test         # Dockerfile for test environment
│── docker-compose.yml      # Docker Compose configuration
│── modules/                # Core business modules
│   ├── admin/             # Admin management module
│   │   └── services/      # Admin services
│── scripts/               # Utility scripts
│   ├── constants/        # Application constants and configurations
│   ├── logging/         # Logging configuration
│   └── schemas/         # Database schemas
│── conf/                # Configuration files
│── logs/               # Application logs

## **🛠️ Setup and Installation**

### Prerequisites
- Python 3.9 or higher
- Docker and Docker Compose
- Redis (optional, for caching)

### Local Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd goat-module
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with required environment variables:
```env
API_BASE_URL=http://localhost:8000
```

## **🐳 Docker Setup**

### Building Docker Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build app
docker-compose build test
```

### Running the Application
```bash
# Run the application in development mode
docker-compose up app

# Run in detached mode
docker-compose up -d app

# View logs
docker-compose logs -f app
```

### Running Tests with Docker
```bash
# Run all tests
docker-compose run test

# Run specific test file
docker-compose run test pytest tests/test_goat.py -v

# Run tests with coverage report
docker-compose run test pytest --cov=. --cov-report=html -v
```

### Managing Docker Services
```bash
# Run all services (app, test, redis)
docker-compose up

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## **🧪 Testing**

### Running Tests Without Docker
```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_goat.py -v

# Run tests with coverage
pytest --cov=. --cov-report=term-missing -v

# Generate HTML coverage report
pytest --cov=. --cov-report=html -v
```

## **🚀 Running Locally Without Docker**

### Running the Application
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Checking Swagger Documentation
http://localhost:8000/docs

## **🔍 Troubleshooting**

### Docker Issues
1. If you encounter permission issues:
```bash
sudo chown -R $USER:$USER .
```

2. If containers fail to start:
```bash
# Check logs
docker-compose logs

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Test Issues
1. If tests fail to connect to the API:
   - Ensure the application is running
   - Check API_BASE_URL in .env file
   - Verify network connectivity between containers

2. If coverage report is not generated:
   - Check if pytest-cov is installed
   - Verify write permissions in the project directory

### APIS 
1. Create Admin
2. Login Admin
3. Get Admin Details
4. Update Admin // not completed
5. Get All Admin
6. Delete Admin
7. Logut

# Chatters
7.Create chatter
8.Update chatter
9.Get chatter
10.Get all chatter
11.Delete chatter
12.Add Chatter Rates
13.Update chatter rates
14.Get chatter Rates



