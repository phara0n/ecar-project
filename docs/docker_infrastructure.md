# Docker Infrastructure Documentation

## Overview

The ECAR project uses Docker and Docker Compose to containerize the entire application stack, providing a consistent environment across development and production. This document covers the setup, maintenance, and troubleshooting of the Docker infrastructure.

## Container Architecture

Our Docker infrastructure consists of the following containers:

1. **Backend (Django)**: Runs the Django REST Framework API
2. **PostgreSQL**: Database server for persistent storage
3. **PgBouncer**: Connection pooling for efficient database connections
4. **Redis**: In-memory cache for session storage and task queue
5. **Nginx**: Web server for static files and API proxying

## Container Ports

| Service    | Internal Port | External Port | Purpose                            |
|------------|--------------|---------------|-----------------------------------|
| Backend    | 8000         | 8000          | Django API                         |
| PostgreSQL | 5432         | 5432          | Database access                    |
| PgBouncer  | 6432         | 6432          | Database connection pooling        |
| Redis      | 6379         | 6379          | Caching and session storage        |
| Nginx      | 80           | 80            | Web server and reverse proxy       |

## Setup Instructions

### Prerequisites

- Docker Engine (20.10+)
- Docker Compose (2.0+)
- No local services using ports 5432, 6379, 6432, 8000, or 80

### Initial Setup

1. Ensure no local PostgreSQL or Redis services are running:
   ```bash
   sudo systemctl stop postgresql redis-server
   sudo systemctl disable postgresql redis-server
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/phara0n/ecar-project.git
   cd ecar_project
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with appropriate values
   ```

4. Start the containers:
   ```bash
   docker-compose up -d
   ```

5. Create initial database migrations (first time only):
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

6. Create a superuser (first time only):
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

## Container Management

### Starting Services

```bash
cd /home/ecar/ecar_project
docker-compose up -d
```

### Stopping Services

```bash
cd /home/ecar/ecar_project
docker-compose down
```

### Viewing Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs db
docker-compose logs redis
```

### Restarting a Specific Service

```bash
docker-compose restart backend
```

## Troubleshooting

### Port Conflicts

If you encounter errors like "address already in use" when starting containers:

1. Check for processes using the required ports:
   ```bash
   netstat -tuln | grep -E "5432|6379|6432|80|8000"
   ```

2. Stop the conflicting services:
   ```bash
   # For PostgreSQL
   sudo systemctl stop postgresql
   sudo systemctl disable postgresql
   
   # For Redis
   sudo systemctl stop redis-server
   sudo systemctl disable redis-server
   
   # For other processes
   sudo lsof -i :PORT_NUMBER
   sudo kill PROCESS_ID
   ```

### Container Exiting with Error 255

Exit code 255 typically indicates a serious error during container startup:

1. Check the container logs:
   ```bash
   docker-compose logs SERVICE_NAME
   ```

2. Verify that volume permissions are correct:
   ```bash
   sudo chown -R 1000:1000 /path/to/volume
   ```

3. Check if required environment variables are set in the .env file.

### Database Connection Issues

If the backend can't connect to PostgreSQL:

1. Verify PgBouncer is running:
   ```bash
   docker-compose ps pgbouncer
   ```

2. Check if the backend environment variables for database connection are correct:
   ```bash
   docker-compose exec backend env | grep DB_
   ```

3. Try connecting directly to check credentials:
   ```bash
   docker-compose exec db psql -U $DB_USER -d $DB_NAME
   ```

## Maintenance Tasks

### Database Backups

```bash
# Manual backup
docker-compose exec db pg_dump -U $DB_USER -d $DB_NAME > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
cat backups/backup-file.sql | docker-compose exec -T db psql -U $DB_USER -d $DB_NAME
```

### Updating Images

```bash
# Pull latest images
docker-compose pull

# Rebuild backend image (after code changes)
docker-compose build backend

# Restart with updated images
docker-compose down
docker-compose up -d
```

## Production Considerations

For production environments, consider the following:

1. Use Docker swarm or Kubernetes for high availability
2. Implement proper logging with ELK or similar
3. Set up monitoring with Prometheus and Grafana
4. Configure automated backups
5. Use Docker secrets for sensitive information
6. Implement container healthchecks
7. Set up container auto-restart policies
8. Use named volumes instead of bind mounts
9. Configure resource limits for containers

## Recent Docker Infrastructure Updates

- **April 2, 2025**: Fixed port conflicts with local services
  - Disabled system PostgreSQL and Redis services
  - Successfully restarted all containers
  - Added comprehensive documentation

## Next Steps

1. Implement automatic container restart on system boot
2. Configure container logs rotation
3. Set up automated database backups
4. Create production-ready Docker Compose configuration with proper resource limits
5. Implement health check dashboard for monitoring container status 