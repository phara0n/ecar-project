# Connection Pooling Setup for ECAR Garage Management System

## Overview

Connection pooling is a critical performance enhancement that allows the ECAR system to handle multiple database connections efficiently. This document outlines the implementation of PgBouncer as the connection pooling solution for our PostgreSQL database, along with the necessary Django configuration changes.

## Why Connection Pooling?

1. **Performance Benefits**:
   - Reduces connection overhead by reusing existing connections
   - Minimizes database server load by limiting the number of active connections
   - Improves response times for database operations

2. **Scalability Advantages**:
   - Supports more concurrent users with fewer resources
   - Prevents connection spikes during peak usage periods
   - Allows for controlled growth without database bottlenecks

## Implementation Steps

### 1. Installing PgBouncer

```bash
# Update package lists
sudo apt update

# Install PgBouncer
sudo apt install -y pgbouncer
```

### 2. Configuring PgBouncer

Create or modify the PgBouncer configuration file:

```bash
sudo nano /etc/pgbouncer/pgbouncer.ini
```

Basic configuration for ECAR:

```ini
[databases]
ecar_db = host=localhost port=5432 dbname=ecar_db

[pgbouncer]
listen_addr = 127.0.0.1
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
```

### 3. Setting Up Authentication

Create the authentication file:

```bash
sudo nano /etc/pgbouncer/userlist.txt
```

Add user credentials (the password should be MD5-hashed):

```
"ecar_user" "md5PASSWORD_HASH"
```

To generate an MD5 password:

```bash
echo -n "PASSWORD_HERE$(echo -n 'ecar_user' | tr -d '\n')" | md5sum | awk '{print "md5" $1}'
```

### 4. Updating Django Settings

Modify the Django database settings to connect through PgBouncer:

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ecar_db'),
        'USER': os.environ.get('DB_USER', 'ecar_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'ecar_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '6432'),  # PgBouncer port
        'CONN_MAX_AGE': 0,  # Let PgBouncer handle connection pooling
        'OPTIONS': {
            'application_name': 'ecar_application',
        },
    }
}
```

### 5. Docker Integration

If running in Docker, update the docker-compose.yml file to include PgBouncer:

```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    ports:
      - "6432:6432"
    environment:
      - DB_USER=ecar_user
      - DB_PASSWORD=ecar_password
      - DB_HOST=postgres
      - DB_NAME=ecar_db
      - POOL_MODE=transaction
      - MAX_CLIENT_CONN=100
      - DEFAULT_POOL_SIZE=20
    depends_on:
      - postgres
    networks:
      - ecar-network
    restart: always
```

## Performance Tuning

### 1. Optimal Pool Size Calculation

The ideal pool size depends on several factors:

- Number of application workers (Gunicorn workers × threads)
- Peak concurrency requirements
- Database server resource limits

Formula for estimation:
```
default_pool_size = (num_gunicorn_workers × num_threads_per_worker) × 1.5
```

Example: With 4 Gunicorn workers and 2 threads each, a reasonable pool size would be:
```
default_pool_size = (4 × 2) × 1.5 = 12
```

### 2. Monitoring Connection Pool Usage

Run the following command to check connection statistics:

```bash
sudo pgbouncer -d "logfile=/tmp/pgbouncer.log" /etc/pgbouncer/pgbouncer.ini
```

Connect to the PgBouncer administrative console:

```bash
psql -p 6432 -U pgbouncer pgbouncer
```

Useful commands:
```sql
SHOW POOLS;
SHOW CLIENTS;
SHOW SERVERS;
SHOW STATS;
```

## Deployment Checklist

- [ ] PgBouncer installed and configured
- [ ] Authentication properly set up
- [ ] Django settings updated
- [ ] Docker configuration updated (if applicable)
- [ ] Connection pool size properly tuned
- [ ] Monitoring tools in place
- [ ] Backup of previous configuration saved
- [ ] Documentation updated with the new connection details

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check if PgBouncer service is running
   - Verify credentials in userlist.txt
   - Ensure the PostgreSQL server is accessible from PgBouncer

2. **Performance Issues**
   - Check if pool size is appropriately configured
   - Verify that Django's CONN_MAX_AGE is set to 0
   - Monitor for connection leaks

3. **Authentication Errors**
   - Double-check the MD5 password hash format
   - Ensure database user has proper permissions

## References

- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [Django Database Settings](https://docs.djangoproject.com/en/stable/ref/settings/#databases)
- [Connection Pooling Best Practices](https://wiki.postgresql.org/wiki/Connection_Pooling) 