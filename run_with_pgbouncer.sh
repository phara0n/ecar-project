#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_DIR="/home/ecar/ecar_project/backend"
ENV_FILE="$BACKEND_DIR/.env.pgbouncer"

# Check if virtual environment exists
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo -e "${RED}Error: Virtual environment not found at $BACKEND_DIR/.venv${NC}"
  echo -e "Please run ${YELLOW}./setup_local_env.sh${NC} first."
  exit 1
fi

# Check if .env.pgbouncer exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Environment file not found at $ENV_FILE${NC}"
  exit 1
fi

# Check if PgBouncer is running
if ! pg_isready -h localhost -p 6432 >/dev/null 2>&1; then
  echo -e "${RED}Error: PgBouncer is not running on port 6432.${NC}"
  echo -e "Run: ${YELLOW}sudo systemctl start pgbouncer${NC}"
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

# Run collectstatic if needed
if [ ! -d "$BACKEND_DIR/staticfiles" ]; then
  echo -e "Collecting static files..."
  python3 manage.py collectstatic --noinput
fi

# Run development server
echo -e "${GREEN}Starting Django development server with PgBouncer...${NC}"
echo -e "The server will be available at ${GREEN}http://localhost:8000${NC}"
echo -e "Press Ctrl+C to stop the server."
echo -e "==============================================="
python3 manage.py runserver 0.0.0.0:8000
