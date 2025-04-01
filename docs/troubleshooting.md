# ECAR Project Troubleshooting Guide

## Docker Environment Issues

### PgBouncer Connection Issues

**Symptoms:**
- Backend container repeatedly restarts
- Logs show connection issues to PostgreSQL
- Database migrations fail
- PgBouncer container shows "unhealthy" status in `docker-compose ps`

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

5. **PgBouncer Health Check Issues (April 2025 Fix)**:
   
   If PgBouncer shows as "unhealthy" in `docker-compose ps` but seems to be functioning correctly:
   
   - **Issue**: The default health check in the docker-compose.yml file uses `pg_isready` which is not available in the Bitnami PgBouncer container.
   
   - **Solution**: Remove the health check section from the PgBouncer service in docker-compose.yml:
     ```yaml
     pgbouncer:
       image: bitnami/pgbouncer:1.21.0
       # ... other configuration ...
       # Remove or comment out the healthcheck section:
       # healthcheck:
       #   test: ["CMD", "pg_isready", "-h", "localhost", "-p", "6432"]
       #   interval: 10s
       #   timeout: 5s
       #   retries: 5
     ```
   
   - **Alternative Solution**: Create a custom health check script in the container:
     ```bash
     # Create a simple script that always returns success
     echo '#!/bin/bash
     exit 0' > /tmp/healthcheck.sh
     chmod +x /tmp/healthcheck.sh
     docker cp /tmp/healthcheck.sh ecar_pgbouncer:/opt/bitnami/scripts/pgbouncer/healthcheck.sh
     
     # Then update docker-compose.yml to use this script
     # healthcheck:
     #   test: ["CMD", "/opt/bitnami/scripts/pgbouncer/healthcheck.sh"]
     ```
   
   - **Verification**: After modifying the configuration and restarting the containers, verify the connection works:
     ```bash
     docker run --rm --network ecar_project_default postgres:15 \
       psql "host=pgbouncer port=6432 dbname=ecar_db user=ecar_user" \
       -c "SELECT 1 as test_connection;"
     ```

### Backend Container Restart Issues

**Symptoms:**
- Backend container shows "Restarting" status
- Missing dependencies errors in logs
- Connection errors to services

**Solutions:**
1. Check the backend logs to identify specific errors:
   ```bash
   docker-compose logs --tail 50 backend
   ```

2. Common causes of container restarts:
   
   - **Missing Python imports**: The most frequent issue is missing import statements in the Django application. After making code changes, ensure all required dependencies are properly imported.
   
   - **Circular import dependencies**: If you have circular imports, the container may fail to start properly.
   
   - **Database connection failures**: If the database is not ready when the backend attempts to connect, the container will restart.

3. Solutions implemented for recent issues:

   - **04/01/2025**: Fixed missing imports in `api/views.py`:
     - Added `cache_page` and `vary_on_cookie` imports from `django.views.decorators.cache`
     - Added `MultiPartParser` and `FormParser` imports from `rest_framework.parsers`
     - Added imports for `RefreshToken`, `timezone`, `csv`, and `StringIO`
     - Added the `HttpResponse` and translation utilities

4. How to fix import errors:
   
   - After identifying the missing import in the logs, edit the relevant file to add the import
   - Restart the backend container with `docker-compose restart backend`
   - Check if the container remains running with `docker-compose ps`

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

## Authentication Issues

### Admin Login Failure After JWT Configuration

**Problem:** After configuring JWT authentication for the API, the Django admin interface stops accepting valid login credentials.

**Cause:** The Django admin interface relies on session-based authentication, but when JWT is configured as the only authentication method in REST Framework settings, it can interfere with the admin site's authentication flow.

**Solution:** Include `SessionAuthentication` alongside `JWTAuthentication` in the REST Framework configuration:

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    # ... other settings
}
```

After making this change, restart the Django server for the changes to take effect. The admin site should now accept valid credentials.

**Explanation:** This configuration allows both JWT-based authentication (for API clients) and session-based authentication (for the admin interface) to coexist, ensuring that both the API and admin site work as expected.

### Alternative Admin Login Method

If you're still experiencing issues logging into the Django admin interface after implementing the above solution, an alternative login page has been set up:

1. Navigate to `/admin-login-fix/` in your browser
2. Enter your admin username and password
3. Upon successful authentication, you'll be redirected to the Django admin interface

This alternative login page bypasses potential JWT configuration issues by using a dedicated API endpoint (`/api/admin-login/`) that explicitly uses Django's session authentication.

## Swagger Documentation Issues

If you're having trouble with the Swagger documentation:

1. Ensure the `drf-yasg` package is properly installed and configured in `settings.py`.

2. Check that URL patterns for Swagger are properly defined in the `urls.py` file.

3. Make sure serializers referenced in `swagger_auto_schema` decorators actually exist.

4. If you encounter nested serializer errors, simplify the serializer definitions or remove the decorators.

5. Check for field name mismatches between serializers and model properties. For example, if a model has a property called `total` but the serializer references it as `total_amount`, Swagger will fail with an error like:
   ```
   ImproperlyConfigured: Field name `total_amount` is not valid for model `Invoice` in `api.serializers.InvoiceSerializer`.
   ```
   
   The solution is to update the serializer field names to match the model property names.

6. Verify that all fields listed in serializer's `fields` attribute actually exist in the model. If a serializer includes fields like `created_at` or `updated_at` but these don't exist in the model, you'll see errors like:
   ```
   ImproperlyConfigured: Field name `created_at` is not valid for model `ServiceItem` in `api.serializers.ServiceItemSerializer`.
   ```
   
   The solution is to remove references to non-existent fields from the serializer.

7. **Validation Script**: To catch these issues proactively, implement a validation script that checks all serializers against their models:
   ```python
   # validation_script.py
   from api.serializers import *
   from core.models import *
   
   def validate_serializer(serializer_class):
       serializer = serializer_class()
       model = serializer.Meta.model
       model_fields = [f.name for f in model._meta.fields]
       model_properties = [name for name in dir(model) if isinstance(getattr(model, name), property)]
       valid_names = set(model_fields + model_properties)
       valid_names.add('id')  # Common field that's handled specially
       
       issues = []
       for field_name in serializer.Meta.fields:
           if field_name not in valid_names and field_name not in serializer._declared_fields:
               issues.append(f"Field '{field_name}' not found in {model.__name__}")
       
       return issues
   
   # Check all serializers
   serializers_to_check = [
       CustomerSerializer, CarSerializer, ServiceSerializer, 
       ServiceItemSerializer, InvoiceSerializer, NotificationSerializer
   ]
   
   for serializer in serializers_to_check:
       issues = validate_serializer(serializer)
       if issues:
           print(f"\nIssues in {serializer.__name__}:")
           for issue in issues:
               print(f"  - {issue}")
   ```
   
   Run this script after making changes to models or serializers to catch field mismatches before they cause Swagger failures.

## JWT Authentication Issues

1. JWT tokens require proper configuration in `settings.py` through the `SIMPLE_JWT` dictionary.

2. Ensure both JWT and Session authentication are included in `DEFAULT_AUTHENTICATION_CLASSES`.

3. For admin login issues, a custom admin login page was created that uses Session authentication.

## API Documentation Fixes

### Swagger Logout Redirection Issue

**Problem**: Clicking logout in the Swagger/API documentation page resulted in a 405 Method Not Allowed error.

**Solution**: Created a custom logout view that properly handles the 'next' parameter:

1. Added a custom logout view in api/views.py:
```python
@require_GET
def custom_logout(request):
    """Custom logout view that properly handles the 'next' parameter."""
    next_url = request.GET.get('next', '/api/docs/')
    logout(request)
    return redirect(next_url)
```

2. Updated URLs configuration in ecar_backend/urls.py to use this custom view:
```python
urlpatterns = [
    path('admin/logout/', custom_logout, name='admin_logout'),  # Custom logout view
    path('admin/', admin.site.urls),
    # ...
]
```

3. Added LOGIN_REDIRECT_URL and LOGOUT_REDIRECT_URL to settings.py:
```python
LOGIN_REDIRECT_URL = '/api/docs/'
LOGOUT_REDIRECT_URL = '/api/docs/'
```

This ensures that when a user logs out from the admin or API documentation, they are properly redirected back to the API documentation page.

## For Developers

When making changes to the ECAR codebase:

1. Always check for import dependencies after adding or modifying code.

2. Test your changes locally before pushing to production.

3. Use the troubleshooting steps in this guide when encountering container restart issues.

4. Document any additional issues and their solutions in this guide for future reference.

## Contact Support

For persistent issues, please reach out to the development team. 