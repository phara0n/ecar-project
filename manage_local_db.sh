#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_DIR="/home/ecar/ecar_project/backend"
ENV_FILE="$BACKEND_DIR/.env.local"

# Function to display usage
usage() {
  echo -e "${BLUE}ECAR Local Database Management Tool${NC}"
  echo -e "Usage: $0 [command]"
  echo -e ""
  echo -e "Commands:"
  echo -e "  ${GREEN}migrate${NC}      - Run database migrations"
  echo -e "  ${GREEN}reset${NC}        - Reset database (drop and recreate)"
  echo -e "  ${GREEN}shell${NC}        - Open Django database shell"
  echo -e "  ${GREEN}backup${NC}       - Create database backup"
  echo -e "  ${GREEN}restore${NC}      - Restore database from backup"
  echo -e "  ${GREEN}showmigrations${NC} - Show migration status"
  echo -e "  ${GREEN}check${NC}        - Run Django system check"
  echo -e "  ${GREEN}help${NC}         - Show this help message"
  exit 1
}

# Check if command is provided
if [ $# -eq 0 ]; then
  usage
fi

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
source "$BACKEND_DIR/.venv/bin/activate"

# Change to backend directory
cd "$BACKEND_DIR" || exit 1

# Load environment variables
set -a
source "$ENV_FILE"
set +a

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo -e "${RED}Error: PostgreSQL is not running.${NC}"
  echo -e "Run: ${YELLOW}sudo systemctl start postgresql${NC}"
  exit 1
fi

# Process commands
case "$1" in
  migrate)
    echo -e "${BLUE}Running migrations...${NC}"
    python3 manage.py migrate
    ;;
  reset)
    echo -e "${RED}Warning: This will reset the database and lose all data.${NC}"
    read -p "Are you sure you want to continue? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
      echo -e "${YELLOW}Dropping database...${NC}"
      sudo -u postgres dropdb ecar_db
      echo -e "${YELLOW}Creating database...${NC}"
      sudo -u postgres createdb -O ecar_user ecar_db
      echo -e "${BLUE}Running migrations...${NC}"
      python3 manage.py migrate
      echo -e "${GREEN}Database has been reset.${NC}"
    else
      echo -e "${YELLOW}Database reset cancelled.${NC}"
    fi
    ;;
  shell)
    echo -e "${BLUE}Opening Django database shell...${NC}"
    python3 manage.py dbshell
    ;;
  backup)
    BACKUP_DIR="$BACKEND_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/ecar_db_$TIMESTAMP.sql"
    echo -e "${BLUE}Creating database backup...${NC}"
    pg_dump -h localhost -U ecar_user -d ecar_db -f "$BACKUP_FILE"
    echo -e "${GREEN}Backup created at: $BACKUP_FILE${NC}"
    ;;
  restore)
    BACKUP_DIR="$BACKEND_DIR/backups"
    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR")" ]; then
      echo -e "${RED}Error: No backups found in $BACKUP_DIR${NC}"
      exit 1
    fi
    
    echo -e "${BLUE}Available backups:${NC}"
    ls -1 "$BACKUP_DIR" | cat -n
    echo ""
    read -p "Enter the number of the backup to restore: " backup_num
    
    BACKUP_FILE=$(ls -1 "$BACKUP_DIR" | sed -n "${backup_num}p")
    if [ -z "$BACKUP_FILE" ]; then
      echo -e "${RED}Error: Invalid backup number${NC}"
      exit 1
    fi
    
    FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    echo -e "${YELLOW}Restoring database from $FULL_BACKUP_PATH...${NC}"
    
    echo -e "${RED}Warning: This will overwrite your current database.${NC}"
    read -p "Are you sure you want to continue? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
      psql -h localhost -U ecar_user -d ecar_db -f "$FULL_BACKUP_PATH"
      echo -e "${GREEN}Database restored.${NC}"
    else
      echo -e "${YELLOW}Database restore cancelled.${NC}"
    fi
    ;;
  showmigrations)
    echo -e "${BLUE}Showing migration status...${NC}"
    python3 manage.py showmigrations
    ;;
  check)
    echo -e "${BLUE}Running Django system check...${NC}"
    python3 manage.py check
    ;;
  help)
    usage
    ;;
  *)
    echo -e "${RED}Error: Unknown command '$1'${NC}"
    usage
    ;;
esac

echo -e "${GREEN}Done.${NC}" 