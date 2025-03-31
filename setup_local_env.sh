#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "===================================================="
echo "ECAR Garage Management System - Local Setup"
echo "===================================================="
echo

# Check if running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "${RED}Please do not run this script as root or with sudo.${NC}"
  exit 1
fi

# Set paths
PROJECT_DIR="/home/ecar/ecar_project"
BACKEND_DIR="$PROJECT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env.local"

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
  exit 1
fi

echo "Setting up local development environment..."
echo

# Create virtual environment
echo "1. Creating Python virtual environment..."
if [ -d "$BACKEND_DIR/.venv" ]; then
  echo -e "${YELLOW}Existing virtual environment found. Skipping creation.${NC}"
else
  cd "$BACKEND_DIR" || exit 1
  python3 -m venv .venv
  echo -e "${GREEN}Virtual environment created at $BACKEND_DIR/.venv${NC}"
fi

# Activate virtual environment
echo -e "\n2. Activating virtual environment..."
source "$BACKEND_DIR/.venv/bin/activate"
echo -e "${GREEN}Virtual environment activated${NC}"

# Install dependencies
echo -e "\n3. Installing Python dependencies..."
pip3 install -r "$BACKEND_DIR/requirements.txt"
echo -e "${GREEN}Dependencies installed${NC}"

# Copy environment file if it doesn't exist
echo -e "\n4. Setting up environment file..."
if [ ! -f "$ENV_FILE" ]; then
  cp "$PROJECT_DIR/backend/.env.local" "$ENV_FILE" 2>/dev/null || cp "$PROJECT_DIR/.env.local" "$ENV_FILE"
  echo -e "${GREEN}Environment file copied to $ENV_FILE${NC}"
else
  echo -e "${YELLOW}Environment file already exists at $ENV_FILE. Skipping.${NC}"
fi

# Create PostgreSQL user and database
echo -e "\n5. Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
  echo -e "${RED}PostgreSQL not found. Please install PostgreSQL:${NC}"
  echo "  sudo apt update && sudo apt install postgresql postgresql-contrib"
  echo -e "${YELLOW}After installation, run this script again.${NC}"
else
  echo -e "${GREEN}PostgreSQL is installed${NC}"
  
  # Check if PostgreSQL is running
  if ! pg_isready &> /dev/null; then
    echo -e "${RED}PostgreSQL service is not running. Please start it:${NC}"
    echo "  sudo systemctl start postgresql"
    echo -e "${YELLOW}After starting PostgreSQL, run this script again.${NC}"
  else
    echo -e "${GREEN}PostgreSQL service is running${NC}"
    
    # Check if user exists
    if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='ecar_user'" | grep -q 1; then
      echo -e "\nCreating PostgreSQL user 'ecar_user'..."
      echo -e "${YELLOW}You will be prompted to enter a password. Use 'ecar_password' for development.${NC}"
      sudo -u postgres createuser -P ecar_user
      echo -e "${GREEN}PostgreSQL user created${NC}"
    else
      echo -e "${YELLOW}PostgreSQL user 'ecar_user' already exists. Skipping.${NC}"
    fi
    
    # Check if database exists
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ecar_db; then
      echo -e "\nCreating PostgreSQL database 'ecar_db'..."
      sudo -u postgres createdb -O ecar_user ecar_db
      echo -e "${GREEN}PostgreSQL database created${NC}"
    else
      echo -e "${YELLOW}PostgreSQL database 'ecar_db' already exists. Skipping.${NC}"
    fi
  fi
fi

# Check Redis installation
echo -e "\n6. Checking Redis installation..."
if ! command -v redis-cli &> /dev/null; then
  echo -e "${RED}Redis not found. Please install Redis:${NC}"
  echo "  sudo apt update && sudo apt install redis-server"
  echo -e "${YELLOW}After installation, run this script again.${NC}"
else
  echo -e "${GREEN}Redis is installed${NC}"
  
  # Check if Redis is running
  if ! redis-cli ping &> /dev/null; then
    echo -e "${RED}Redis service is not running. Please start it:${NC}"
    echo "  sudo systemctl start redis-server"
    echo -e "${YELLOW}After starting Redis, run this script again.${NC}"
  else
    echo -e "${GREEN}Redis service is running${NC}"
  fi
fi

# Run Django migrations
echo -e "\n7. Running Django migrations..."
cd "$BACKEND_DIR" || exit 1
python3 manage.py migrate
echo -e "${GREEN}Migrations applied${NC}"

echo -e "\n===================================================="
echo -e "${GREEN}Setup complete!${NC}"
echo -e "===================================================="
echo -e "\nTo start the development server, run:"
echo -e "  cd $BACKEND_DIR"
echo -e "  source .venv/bin/activate"
echo -e "  python3 manage.py runserver 0.0.0.0:8000"
echo -e "\nThe server will be available at http://localhost:8000" 