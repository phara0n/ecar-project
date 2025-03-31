# PostgreSQL Migration Guide

## Overview

This document outlines the process of migrating the ECAR Garage Management System from SQLite to PostgreSQL. The migration ensures better performance, concurrency, and reliability as the system scales.

## Prerequisites

Before migrating to PostgreSQL, ensure the following prerequisites are met:

1. PostgreSQL 15+ installed on the server
2. `psycopg2-binary` Python package installed
3. Appropriate PostgreSQL user and database created
4. Backup of existing SQLite database

## Migration Steps

### 1. Install Required Packages

```bash
# Install PostgreSQL client and server
sudo apt-get install postgresql postgresql-client -y

# Install Python PostgreSQL adapter
pip install psycopg2-binary
```

### 2. Create PostgreSQL User and Database

```bash
# Create a user for the application
sudo -u postgres psql -c "CREATE USER ecar_user WITH PASSWORD 'ecar_password';"

# Create a database owned by the user
sudo -u postgres psql -c "CREATE DATABASE ecar_db OWNER ecar_user;"

# Grant necessary privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecar_db TO ecar_user;"
```

### 3. Update Django Settings

Update the `settings.py` file to use PostgreSQL instead of SQLite:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ecar_db'),
        'USER': os.environ.get('DB_USER', 'ecar_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'ecar_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

### 4. Update Environment Variables

In the `.env` file, set the following variables:

```
DB_NAME=ecar_db
DB_USER=ecar_user
DB_PASSWORD=ecar_password
DB_HOST=localhost
DB_PORT=5432
```

For Docker deployments, use:

```
DB_HOST=db
```

### 5. Migrate Data

#### Option 1: Using Django Management Commands

```bash
# Create a data dump from SQLite
python manage.py dumpdata --exclude=contenttypes --exclude=auth.permission > data.json

# Migrate schema to PostgreSQL
python manage.py migrate

# Load data into PostgreSQL
python manage.py loaddata data.json
```

#### Option 2: Using Direct SQL Export/Import

For larger datasets, consider using database-specific tools:

```bash
# Extract data from SQLite
sqlite3 db.sqlite3 .dump > dump.sql

# Convert SQLite dump to PostgreSQL format (manual process)
# ...

# Import into PostgreSQL
psql -U ecar_user -d ecar_db -f postgres_dump.sql
```

### 6. Verify Migration

After migration, perform these verification steps:

1. Run the application and check if all features work correctly
2. Verify data integrity by checking key records
3. Test CRUD operations on each model

## Docker Configuration

For Docker deployments, the `docker-compose.yml` file already includes PostgreSQL configuration. Ensure the environment variables in the `.env` file are set correctly:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data/
    env_file:
      - ./.env
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_DB=${DB_NAME}
    ports:
      - "5432:5432"
```

## Performance Optimization

After migration, consider these PostgreSQL-specific optimizations:

1. Configure connection pooling with `django-db-connection-pool`
2. Add appropriate indexes to frequently queried fields
3. Implement PostgreSQL-specific features like full-text search
4. Tune PostgreSQL settings based on server resources

## Rollback Plan

In case of migration issues, prepare a rollback plan:

1. Keep the original SQLite database as backup
2. Create a snapshot of the PostgreSQL database before loading data
3. Have scripts ready to revert to SQLite if needed

## Monitoring

After migration, monitor database performance:

1. Set up `django-debug-toolbar` for development
2. Configure PostgreSQL monitoring tools (pgAdmin, pg_stat_statements)
3. Set up regular database maintenance tasks (VACUUM, ANALYZE)

## Known Issues and Solutions

- **Connection Refused**: Ensure PostgreSQL is running and the host is accessible
- **Permission Denied**: Check user permissions and pg_hba.conf configuration
- **Migration Errors**: Run `python manage.py showmigrations` to check status 