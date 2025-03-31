# ECAR Garage Management System - Setup Guide

## Overview

This document provides a guide for setting up the ECAR Garage Management System in both Docker and local development environments.

## System Architecture

The ECAR Garage Management System consists of the following components:

- **Backend API**: Django + DRF (Python)
- **Database**: PostgreSQL
- **Connection Pooling**: PgBouncer
- **Caching**: Redis
- **Web Server**: Nginx (for production)

## Docker Setup (Recommended)

The project is containerized using Docker to ensure consistency across environments.

### Prerequisites

- Docker and Docker Compose installed
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/phara0n/ecarv1.git
   cd ecarv1
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Start the containers:
   ```bash
   docker-compose up -d
   ```

4. Create a superuser (if not already created):
   ```bash
   docker exec -it ecar_project_backend_1 python manage.py createsuperuser
   ```

5. Access the application:
   - Frontend: http://localhost:80
   - Admin interface: http://localhost:8000/admin
   - API: http://localhost:8000/api/

### Default Admin Credentials

- **Username**: admin
- **Password**: admin123
- **Email**: admin@ecar.tn

### Docker Container Structure

- **backend**: Django application with DRF
- **db**: PostgreSQL database
- **pgbouncer**: Connection pooling for PostgreSQL
- **redis**: Caching service
- **nginx**: Web server for routing requests

## Local Development Setup

For development purposes, you can run the system locally without Docker.

### Prerequisites

- Python 3.12
- PostgreSQL 15
- Redis
- PgBouncer (optional, for connection pooling)

### Setup Steps

1. Install Python dependencies:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with local settings
   ```

3. Setup utility scripts:
   
   The project includes several utility scripts to help with local development:
   
   - `setup_local_env.sh`: Sets up the virtual environment and database
   - `manage_local_db.sh`: Manages database operations
   - `setup_pgbouncer.sh`: Configures PgBouncer for connection pooling
   - `run_with_pgbouncer.sh`: Runs the Django server with PgBouncer
   - `check_local_services.sh`: Checks the status of required services
   - `run_local_server.sh`: Runs the Django development server

4. Running the server:
   ```bash
   ./run_local_server.sh
   # Or with PgBouncer:
   ./run_with_pgbouncer.sh
   ```

## Configuration Details

### Django Settings

Key settings are configured through environment variables:

- `DEBUG`: Set to `True` for development
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `SECRET_KEY`: Django secret key
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`: Database connection settings

### Connection Pooling with PgBouncer

PgBouncer is configured to:

- Use transaction pooling mode
- Limit connections to 100 clients
- Default pool size of 20 connections

### Database Migrations

Migrations are applied automatically in Docker. For local development:

```bash
python manage.py migrate
```

## Common Issues and Solutions

### Permission Issues in Docker

If you encounter permission issues with Docker volumes, you can:

1. Update the user ID in docker-compose.yml:
   ```yaml
   user: "1000:1000"  # Replace with your user:group ID
   ```

2. Change permissions of mounted volumes:
   ```bash
   chmod -R 777 media/ staticfiles/
   ```

### PgBouncer Connection Issues

If you have issues connecting through PgBouncer:

1. Check PgBouncer is running:
   ```bash
   sudo systemctl status pgbouncer  # For local setup
   docker-compose ps  # For Docker
   ```

2. Verify PgBouncer configuration in:
   - Docker: Check environment variables in docker-compose.yml
   - Local: Check /etc/pgbouncer/pgbouncer.ini

### Database Connection Issues

If Django can't connect to the database:

1. Verify database credentials in .env
2. Check that the database service is running
3. For Docker, ensure the DB_HOST is set to the correct service name (e.g., 'db' or 'pgbouncer')

## Deployment Recommendations

For production deployment:

1. Use a dedicated PostgreSQL server with proper backup configuration
2. Configure HTTPS with Let's Encrypt certificates
3. Use a domain name and configure DNS
4. Set up monitoring and logging
5. Configure rate limiting and security measures

## Maintenance

### Backups

Database backups are configured in the `manage_local_db.sh` script for local development. For production, set up automated backups using:

```bash
pg_dump -h localhost -U ecar_user -d ecar_db -f backup.sql
```

### Logs

Logs are available at:

- Docker: `docker logs ecar_project_backend_1`
- Local: Django logs in the terminal and database logs in PostgreSQL logs

## Additional Resources

- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- PgBouncer Documentation: https://www.pgbouncer.org/usage.html 