#!/bin/bash

# Script to deploy PgBouncer in development environment
# This script should be run from the project root directory

set -e  # Exit on error

echo "=== PgBouncer Deployment Script ==="
echo "Date: $(date)"
echo

# Check if running from project root
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: This script must be run from the project root directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Backup current database
echo "Creating database backup..."
mkdir -p backups
BACKUP_FILE="backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T db pg_dump -U ${DB_USER:-ecar_user} -d ${DB_NAME:-ecar_db} > $BACKUP_FILE
echo "Backup created: $BACKUP_FILE"

# Make sure directories exist
echo "Setting up directories..."
mkdir -p backend/docker/pgbouncer
mkdir -p logs/pgbouncer
mkdir -p reports/pgbouncer

# Check if configuration files exist
if [ ! -f "backend/docker/pgbouncer/pgbouncer.ini" ] || [ ! -f "backend/docker/pgbouncer/userlist.txt" ]; then
    echo "Error: PgBouncer configuration files not found"
    echo "Please create the following files:"
    echo "  - backend/docker/pgbouncer/pgbouncer.ini"
    echo "  - backend/docker/pgbouncer/userlist.txt"
    exit 1
fi

# Make the check_pgbouncer.sh script executable
echo "Setting up monitoring scripts..."
chmod +x backend/scripts/check_pgbouncer.sh

# Stop current services
echo "Stopping current services..."
docker-compose down

# Start services with PgBouncer
echo "Starting services with PgBouncer..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if PgBouncer is running
echo "Checking PgBouncer status..."
if docker-compose exec pgbouncer pg_isready -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer; then
    echo "PgBouncer is running and accepting connections"
else
    echo "Warning: PgBouncer may not be running properly"
fi

# Check database connection through PgBouncer
echo "Testing database connection through PgBouncer..."
if docker-compose exec pgbouncer psql -h 127.0.0.1 -p 6432 -U ${DB_USER:-ecar_user} -d ${DB_NAME:-ecar_db} -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Database connection through PgBouncer successful"
else
    echo "Warning: Could not connect to database through PgBouncer"
fi

# Run the monitoring command
echo "Running initial PgBouncer monitoring..."
docker-compose exec backend python manage.py monitor_pgbouncer

echo
echo "=== PgBouncer Deployment Complete ==="
echo "Next steps:"
echo "1. Check logs/pgbouncer for monitoring logs"
echo "2. Verify application functionality"
echo "3. Test performance improvements"
echo
echo "To monitor PgBouncer:"
echo "docker-compose exec backend python manage.py monitor_pgbouncer"
echo
echo "To check logs:"
echo "docker-compose logs pgbouncer"
echo 