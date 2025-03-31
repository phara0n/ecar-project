# Setting Up PgBouncer Locally

This guide will help you set up PgBouncer locally to replicate the Docker environment's connection pooling.

## Prerequisites

- PostgreSQL is installed and running
- Redis is installed and running
- The local Django environment is functioning correctly

## 1. Install PgBouncer

```bash
# Install PgBouncer
sudo apt update
sudo apt install -y pgbouncer
```

## 2. Configure PgBouncer

### Create pgbouncer configuration files

Create or edit `/etc/pgbouncer/pgbouncer.ini`:

```bash
sudo nano /etc/pgbouncer/pgbouncer.ini
```

Replace the contents with:

```ini
[databases]
ecar_db = host=localhost port=5432 dbname=ecar_db

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = trust
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
min_pool_size = 0
reserve_pool_size = 5
reserve_pool_timeout = 3
log_connections = 1
log_disconnections = 1
admin_users = postgres,ecar_user
stats_users = postgres,ecar_user
```

### Create the userlist file

```bash
sudo nano /etc/pgbouncer/userlist.txt
```

Add the following content:

```
"ecar_user" "ecar_password"
"postgres" "postgres"
```

## 3. Start/restart PgBouncer

```bash
sudo systemctl restart pgbouncer
sudo systemctl status pgbouncer
```

## 4. Test PgBouncer Connection

```bash
psql -h localhost -p 6432 -U ecar_user -d ecar_db -c "SELECT 1 as connection_test;"
```

## 5. Update Django Settings

Create a new `.env.pgbouncer` file in the backend directory:

```bash
# Copy the existing .env.local file
cp /home/ecar/ecar_project/backend/.env.local /home/ecar/ecar_project/backend/.env.pgbouncer

# Edit the new file
nano /home/ecar/ecar_project/backend/.env.pgbouncer
```

Update the database settings in the new file:

```
# Database settings (with PgBouncer)
DB_NAME=ecar_db
DB_USER=ecar_user
DB_PASSWORD=ecar_password
DB_HOST=localhost
DB_PORT=6432
CONN_MAX_AGE=0  # Important: Set to 0 when using PgBouncer
```

## 6. Run Django with PgBouncer

```bash
cd /home/ecar/ecar_project/backend
source .venv/bin/activate

# Load environment variables from .env.pgbouncer
export $(grep -v '^#' .env.pgbouncer | xargs)

# Run the server
python3 manage.py runserver 0.0.0.0:8000
```

## 7. Troubleshooting

### Check PgBouncer logs

```bash
sudo tail -f /var/log/postgresql/pgbouncer.log
```

### Check connections and pools

```bash
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW pools;"
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW clients;"
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW servers;"
```

### Restart PgBouncer to apply config changes

```bash
sudo systemctl restart pgbouncer
```

## 8. Common Issues

1. **Authentication errors**: Verify userlist.txt has correct format
2. **Connection refused**: Check if PgBouncer is running (`sudo systemctl status pgbouncer`)
3. **Database not found**: Verify database name in pgbouncer.ini matches PostgreSQL
4. **Pool errors**: Check max_client_conn and default_pool_size settings 