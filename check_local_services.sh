#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "Checking local services for ECAR project..."
echo

# Check if PostgreSQL is installed
echo -n "PostgreSQL installed: "
if command -v psql >/dev/null 2>&1; then
    echo -e "${GREEN}YES${NC}"
else
    echo -e "${RED}NO${NC} - Please install PostgreSQL"
fi

# Check if PostgreSQL is running
echo -n "PostgreSQL running: "
if pg_isready >/dev/null 2>&1; then
    echo -e "${GREEN}YES${NC}"
else
    echo -e "${RED}NO${NC} - Please start PostgreSQL service"
fi

# Check if Redis is installed
echo -n "Redis installed: "
if command -v redis-cli >/dev/null 2>&1; then
    echo -e "${GREEN}YES${NC}"
else
    echo -e "${RED}NO${NC} - Please install Redis"
fi

# Check if Redis is running
echo -n "Redis running: "
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}YES${NC}"
else
    echo -e "${RED}NO${NC} - Please start Redis service"
fi

echo -e "\nChecking database..."
# Check if the ecar_db database exists
echo -n "Database 'ecar_db' exists: "
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw ecar_db; then
    echo -e "${GREEN}YES${NC}"
else
    echo -e "${YELLOW}NO${NC} - You may need to create the database"
    echo "Run: sudo -u postgres createdb -O ecar_user ecar_db"
fi

# Check if the ecar_user user exists
echo -n "Database user 'ecar_user' exists: "
if sudo -u postgres psql -t -c "SELECT 1 FROM pg_roles WHERE rolname='ecar_user'" postgres | grep -q 1; then
    echo -e "${GREEN}YES${NC}"
else
    echo -e "${YELLOW}NO${NC} - You may need to create the user"
    echo "Run: sudo -u postgres createuser -P ecar_user"
fi

echo -e "\nLocal environment check complete." 