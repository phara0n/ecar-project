# Docker Connection Pooling Setup

This document provides detailed instructions for implementing PgBouncer connection pooling in a Docker environment for the ECAR Garage Management System.

## Docker Compose Configuration

Add the following service to your `docker-compose.yml` file:

```yaml
services:
  # Existing services (postgres, django, etc.)
  
  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: ecar_pgbouncer
    restart: always
    ports:
      - "6432:6432"
    environment:
      - DB_USER=${DB_USER:-ecar_user}
      - DB_PASSWORD=${DB_PASSWORD:-ecar_password}
      - DB_HOST=postgres
      - DB_NAME=${DB_NAME:-ecar_db}
      - POOL_MODE=transaction
      - MAX_CLIENT_CONN=100
      - DEFAULT_POOL_SIZE=20
      - MIN_POOL_SIZE=5
      - RESERVE_POOL_SIZE=10
      - MAX_DB_CONNECTIONS=50
      - MAX_USER_CONNECTIONS=50
      - ADMIN_USERS=postgres,ecar_admin
    volumes:
      - pgbouncer-data:/etc/pgbouncer
    depends_on:
      - postgres
    networks:
      - ecar-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  # Existing volumes
  pgbouncer-data:

networks:
  ecar-network:
    driver: bridge
```

## Django Service Configuration

Update the Django service to use PgBouncer instead of connecting directly to PostgreSQL:

```yaml
services:
  django:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ecar_django
    restart: always
    volumes:
      - ./backend:/app
      - static_volume:/app/static
      - media_volume:/app/media
    environment:
      - DEBUG=0
      - SECRET_KEY=${SECRET_KEY}
      - DB_NAME=${DB_NAME:-ecar_db}
      - DB_USER=${DB_USER:-ecar_user}
      - DB_PASSWORD=${DB_PASSWORD:-ecar_password}
      - DB_HOST=pgbouncer  # Changed from postgres to pgbouncer
      - DB_PORT=6432       # PgBouncer port
      - CONN_MAX_AGE=0     # Important: Let PgBouncer handle connection pooling
    depends_on:
      - pgbouncer
    networks:
      - ecar-network
```

## Environment Variables

Update your `.env` file with PgBouncer-specific settings:

```
# PostgreSQL Configuration
DB_NAME=ecar_db
DB_USER=ecar_user
DB_PASSWORD=your_secure_password
DB_HOST=pgbouncer  # Changed from postgres to pgbouncer
DB_PORT=6432       # PgBouncer port

# PgBouncer Configuration
PGBOUNCER_MAX_CLIENT_CONN=100
PGBOUNCER_DEFAULT_POOL_SIZE=20
PGBOUNCER_MIN_POOL_SIZE=5
PGBOUNCER_RESERVE_POOL_SIZE=10
```

## Custom PgBouncer Configuration

If you need a more customized PgBouncer setup, create a `pgbouncer.ini` file:

```ini
# backend/docker/pgbouncer/pgbouncer.ini
[databases]
* = host=postgres port=5432

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 10
reserve_pool_timeout = 5.0
max_db_connections = 50
max_user_connections = 50
server_reset_query = DISCARD ALL
server_check_query = SELECT 1
application_name_add_host = 1
ignore_startup_parameters = extra_float_digits
```

Then update your docker-compose.yml to use this file:

```yaml
services:
  pgbouncer:
    # other configuration
    volumes:
      - ./backend/docker/pgbouncer/pgbouncer.ini:/etc/pgbouncer/pgbouncer.ini
      - ./backend/docker/pgbouncer/userlist.txt:/etc/pgbouncer/userlist.txt
```

## Authentication Setup

Create a `userlist.txt` file for PgBouncer authentication:

```
# backend/docker/pgbouncer/userlist.txt
"ecar_user" "md5HASH_OF_PASSWORD"
"pgbouncer" "md5HASH_OF_PGBOUNCER_PASSWORD"
```

To generate the MD5 hash of the password:

```bash
# Run inside the Docker container or on your local machine
echo -n "PASSWORD_HERE$(echo -n 'ecar_user' | tr -d '\n')" | md5sum | awk '{print "md5" $1}'
```

## Monitoring Setup

Add a monitoring service using pgBadger for connection pool analysis:

```yaml
services:
  pgbadger:
    image: dalibo/pgbadger
    container_name: ecar_pgbadger
    volumes:
      - ./logs:/var/log/postgresql
      - ./reports:/reports
    command: ["--output-file", "/reports/report.html", "--prefix", "%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ", "/var/log/postgresql/*.log"]
    depends_on:
      - postgres
    networks:
      - ecar-network
```

## Testing the Connection Pooling

After deployment, you can test the connection pooling with:

```bash
# Connect to PgBouncer admin console
docker exec -it ecar_pgbouncer psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer

# Inside the PgBouncer admin console, run:
SHOW POOLS;
SHOW STATS;
```

## Deployment Steps

1. Backup your existing database:
   ```bash
   docker exec -t ecar_postgres pg_dump -U ecar_user -d ecar_db > ecar_db_backup.sql
   ```

2. Update your docker-compose.yml file with the PgBouncer service.

3. Update the Django service to use PgBouncer instead of PostgreSQL directly.

4. Create or update your environment variables.

5. Deploy the updated Docker Compose configuration:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

6. Verify that PgBouncer is working correctly:
   ```bash
   docker logs ecar_pgbouncer
   docker exec -it ecar_pgbouncer psql -h 127.0.0.1 -p 6432 -U pgbouncer pgbouncer -c "SHOW POOLS;"
   ```

## Troubleshooting Docker-Specific Issues

1. **Container Startup Order**
   - If PostgreSQL is not ready when PgBouncer tries to connect, use Docker's `depends_on` with `condition: service_healthy` to ensure proper startup order.

2. **Network Connectivity**
   - Ensure that both containers are on the same Docker network.
   - Check that the container names are correctly referenced in connection strings.

3. **Volume Permissions**
   - If you're mounting custom configuration files, ensure they have the correct permissions.

4. **Container Resource Limits**
   - Add resource constraints to your Docker Compose file if needed:
     ```yaml
     services:
       pgbouncer:
         # other configuration
         deploy:
           resources:
             limits:
               cpus: '0.5'
               memory: 256M
     ```

## Next Steps

- Set up Prometheus and Grafana for monitoring PgBouncer metrics
- Configure log rotation for PgBouncer logs
- Implement connection pooling for the admin interface 