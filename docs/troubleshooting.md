# ECAR Project Troubleshooting Guide

## Docker Environment Issues

### PgBouncer Connection Issues

**Symptoms:**
- Backend container repeatedly restarts
- Logs show connection issues to PostgreSQL
- Database migrations fail

**Solutions:**
1. Verify PgBouncer configuration:
   ```bash
   docker-compose exec pgbouncer cat /opt/bitnami/pgbouncer/conf/pgbouncer.ini
   ```

2. Test direct database connection:
   ```bash
   docker-compose exec db psql -U ecar_user -d ecar_db -c "SELECT 1;"
   ```

3. Test connection through PgBouncer:
   ```bash
   docker run --rm --network=ecar_project_default postgres:15 \
     psql "host=pgbouncer port=6432 dbname=ecar_db user=ecar_user password=ecar_password" \
     -c "SELECT 1 as connection_test;"
   ```

4. Check PgBouncer logs:
   ```bash
   docker-compose logs pgbouncer
   ```

### Backend Container Restart Issues

**Symptoms:**
- Backend container shows "Restarting" status
- Missing dependencies errors in logs
- Connection errors to services

**Solutions:**
1. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

2. Verify all dependencies are installed:
   ```bash
   docker-compose exec backend pip list
   ```

3. Test Django configuration:
   ```bash
   docker-compose run --rm backend python manage.py check
   ```

4. Test migrations status:
   ```bash
   docker-compose run --rm backend python manage.py showmigrations
   ```

## Local Environment Setup

### PostgreSQL Installation

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createuser -P ecar_user
sudo -u postgres createdb -O ecar_user ecar_db
```

### Redis Installation

**Ubuntu/Debian:**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start and enable service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli ping
```

### Python Environment

**Issues with dependencies:**
```bash
# Create a fresh virtual environment
cd /home/ecar/ecar_project/backend
python -m venv .venv_new
source .venv_new/bin/activate

# Install dependencies
pip install -r requirements.txt

# Test Django
python manage.py check
```

## Common Django Issues

### Database Migration Issues

**Solutions:**
1. Reset database (development only):
   ```bash
   # Drop and recreate database
   sudo -u postgres dropdb ecar_db
   sudo -u postgres createdb -O ecar_user ecar_db
   
   # Run migrations
   python manage.py migrate
   ```

2. Fake initial migrations:
   ```bash
   python manage.py migrate --fake-initial
   ```

### Static Files Issues

**Solutions:**
1. Collect static files:
   ```bash
   python manage.py collectstatic --noinput
   ```

2. Check static files configuration in settings.py:
   ```python
   STATIC_URL = 'static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   ```

## Performance Optimization

### Django Debug Toolbar

1. Ensure it's installed and configured correctly:
   ```bash
   pip install django-debug-toolbar
   ```

2. Verify settings include required apps and middleware:
   ```python
   INSTALLED_APPS = [
       # ...
       'debug_toolbar',
       # ...
   ]
   
   MIDDLEWARE = [
       # ...
       'debug_toolbar.middleware.DebugToolbarMiddleware',
       # ...
   ]
   
   INTERNAL_IPS = [
       '127.0.0.1',
   ]
   ```

## Contact Support

For persistent issues, please reach out to the development team. 