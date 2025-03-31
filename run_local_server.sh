#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_DIR="/home/ecar/ecar_project/backend"
ENV_FILE="$BACKEND_DIR/.env.local"

# Check if virtual environment exists
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo -e "${RED}Error: Virtual environment not found at $BACKEND_DIR/.venv${NC}"
  echo -e "Please run ${YELLOW}./setup_local_env.sh${NC} first."
  exit 1
fi

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file not found at $ENV_FILE${NC}"
  echo -e "Please run ${YELLOW}./setup_local_env.sh${NC} first."
  exit 1
fi

# Activate virtual environment
echo -e "Activating virtual environment..."
source "$BACKEND_DIR/.venv/bin/activate"

# Change to backend directory
cd "$BACKEND_DIR" || exit 1

# Load environment variables
echo -e "Loading environment from ${YELLOW}$ENV_FILE${NC}..."
set -a
source "$ENV_FILE"
set +a

# Check if local services are running
echo -e "Checking local services..."
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo -e "${RED}Warning: PostgreSQL is not running.${NC}"
  echo -e "Run: ${YELLOW}sudo systemctl start postgresql${NC}"
  exit 1
fi

if ! redis-cli ping >/dev/null 2>&1; then
  echo -e "${RED}Warning: Redis is not running.${NC}"
  echo -e "Run: ${YELLOW}sudo systemctl start redis-server${NC}"
  exit 1
fi

# Run collectstatic if needed
if [ ! -d "$BACKEND_DIR/staticfiles" ]; then
  echo -e "Collecting static files..."
  python3 manage.py collectstatic --noinput
fi

# Run development server
echo -e "${GREEN}Starting Django development server...${NC}"
echo -e "The server will be available at ${GREEN}http://localhost:8000${NC}"
echo -e "Press Ctrl+C to stop the server."
echo -e "==============================================="
python3 manage.py runserver 0.0.0.0:8000 