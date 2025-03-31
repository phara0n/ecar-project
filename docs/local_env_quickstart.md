# ECAR Local Environment Quick Reference

This document provides a quick reference for the local development environment.

## Setup

Before starting, make sure PostgreSQL and Redis are installed and running on your system.

```bash
# Initial setup (only needed once)
./setup_local_env.sh

# Check if services are running properly
./check_local_services.sh
```

## Starting the Development Server

```bash
# Start the Django development server
./run_local_server.sh
```

The server will be available at http://localhost:8000

## Database Management

The `manage_local_db.sh` script provides several database management commands:

```bash
# Run migrations
./manage_local_db.sh migrate

# Show migration status
./manage_local_db.sh showmigrations

# Reset database (use with caution - this will delete all data)
./manage_local_db.sh reset

# Create a database backup
./manage_local_db.sh backup

# Restore from a database backup
./manage_local_db.sh restore

# Open Django database shell
./manage_local_db.sh shell

# Run Django system check
./manage_local_db.sh check
```

## Common Django Commands

These commands can be run from within the virtual environment:

```bash
# Activate virtual environment
cd /home/ecar/ecar_project/backend
source .venv/bin/activate

# Create Django superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic

# Run Django shell
python manage.py shell

# Run specific app migrations
python manage.py migrate app_name
```

## Environment Variables

The local environment uses variables defined in:
```
/home/ecar/ecar_project/backend/.env.local
```

You can modify this file to change configuration settings.

## Switching Back to Docker

If you need to switch back to using Docker:

```bash
# Start Docker services
cd /home/ecar/ecar_project
docker-compose up -d

# Check Docker service status
docker-compose ps
```

## Troubleshooting

For troubleshooting issues, refer to the [Troubleshooting Guide](./troubleshooting.md).

Common issues:
- PostgreSQL or Redis not running - Start the services with `sudo systemctl start postgresql` and `sudo systemctl start redis-server`
- Database connection errors - Check user permissions or try resetting the database
- Missing migrations - Run `./manage_local_db.sh migrate` 