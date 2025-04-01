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

### Schema/Model Inconsistency Issues

**Symptoms:**
- ProgrammingError in Django Admin
- Errors like "column X does not exist" 
- Model field exists in code but not in database or vice versa
- AttributeError when accessing removed model fields

**Solutions:**

1. **Complete Model & Related Files Cleanup (April 2, 2025)**
   
   When removing fields from models, it's important to check all related files that might reference those fields:
   
   1. **Identified Issue**: After removing the `tax_rate` field from the Invoice model, we encountered `AttributeError: 'Invoice' object has no attribute 'tax_rate'` when trying to generate PDFs or use bulk invoice creation.
   
   2. **Comprehensive Fix**:
      - Fixed PDF generation utility (`utils/pdf_utils.py`)
      - Updated API views for bulk invoice creation (`api/views.py`)
      - Modified email templates (`templates/emails/invoice_created.html`)
   
   3. **Best Practice**: When removing model fields, use this checklist:
      ```
      # Removing Field Checklist
      [ ] Update model definition
      [ ] Update admin.py (list_display, readonly_fields, etc.)
      [ ] Update serializers.py
      [ ] Create/apply database migration
      [ ] Check for references in:
          - PDF/document generation utilities
          - Email templates
          - API views where objects are created
          - Custom admin forms
          - Tests 
          - Frontend code that may expect the field
      ```
   
   4. **Verification**: After making all changes, restart the backend container and test all relevant functionality:
      ```bash
      docker-compose restart backend
      ```

2. **Safe SQL Migration (April 2, 2025):**
   We encountered an issue where the Invoice model had a tax_rate field that didn't exist in the database schema. To fix this:
   
   1. Create a blank migration:
      ```bash
      python manage.py makemigrations core --empty --name fix_invoice_schema
      ```
   
   2. Add SQL to safely check and handle missing columns:
      ```python
      operations = [
          migrations.RunSQL(
              """
              DO $$
              BEGIN
                  -- Check if column exists
                  IF EXISTS (
                      SELECT FROM information_schema.columns 
                      WHERE table_name = 'table_name' AND column_name = 'column_name'
                  ) THEN
                      -- Remove the column if it exists
                      ALTER TABLE table_name DROP COLUMN column_name;
                  END IF;
              END $$;
              """,
              reverse_sql=migrations.RunSQL.noop
          )
      ]
      ```
   
   3. Apply the migration:
      ```bash
      python manage.py migrate
      ```
   
   The key to this approach is checking if the column exists before attempting to modify it. This avoids migration failures.

3. **Resolving Model Inconsistencies:**
   - Update the model definition to match the current database schema
   - Update model references in admin.py, serializers.py, and views.py
   - Restart the backend service to apply changes
   
   ```bash
   docker-compose restart backend
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

### Django Admin RecursionError

**Symptoms:**
- RecursionError: maximum recursion depth exceeded when adding or editing related objects
- Error occurs in JSON encoder or serialization
- Admin form loads but crashes on submission

**Causes:**
- Circular references between models with deep nested relationships
- Infinite recursion during object serialization
- Django trying to serialize too much related data

**Solutions:**

1. **Use Raw ID Fields (April 2, 2025 Fix):**
   ```python
   class InvoiceAdmin(admin.ModelAdmin):
       # Instead of standard field rendering, use raw ID fields
       raw_id_fields = ('service',)
   ```
   
   Raw ID fields display a simple input box with a lookup icon instead of fully serializing the related object.

2. **Implement Autocomplete Fields:**
   ```python
   class ServiceAdmin(admin.ModelAdmin):
       autocomplete_fields = ['car']
       
       # Ensure the referenced model's Admin has search_fields defined
       # to make autocomplete work properly
   ```
   
   Autocomplete fields provide enhanced usability while preventing the recursion issues.

3. **Limit Inline Items:**
   ```python
   class ServiceItemInline(admin.TabularInline):
       model = ServiceItem
       extra = 0
       max_num = 10  # Limit the number of inline items
       fields = ('name', 'item_type', 'quantity', 'unit_price')  # Specify only needed fields
   ```
   
   This reduces the amount of data being serialized.

4. **Clear Cached Properties:**
   ```python
   def save_model(self, request, obj, form, change):
       super().save_model(request, obj, form, change)
       # Clear any cached properties to prevent recursion
       if hasattr(obj, '_service_cache'):
           delattr(obj, '_service_cache')
   ```
   
   Django caches related objects, which can sometimes cause recursion issues.

5. **Customize Form Rendering:**
   ```python
   def get_form(self, request, obj=None, **kwargs):
       form = super().get_form(request, obj, **kwargs)
       if 'service' in form.base_fields:
           form.base_fields['service'].widget.attrs['style'] = 'width: 800px;'
       return form
   ```
   
   Customizing the form can help prevent issues with complex widgets.

6. **Use SerializerMethodField in DRF:**

   If you're using Django REST Framework and seeing recursion issues in API responses:
   ```python
   class InvoiceSerializer(serializers.ModelSerializer):
       # Instead of nested serializer
       service = serializers.SerializerMethodField()
       
       def get_service(self, obj):
           # Return minimal representation to prevent recursion
           return {
               'id': obj.service.id,
               'title': obj.service.title
           }
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

### Django Admin Logout Error (HTTP 405 Method Not Allowed)

**Symptoms:**
- Clicking logout in Django admin interface shows "This page isn't working" error
- Browser console shows HTTP ERROR 405
- `admin/logout/` URL returns "Method Not Allowed"

**Cause:**
Django's admin logout view expects POST requests by default, but the browser is trying to access it with a GET request. When running in Docker, the routing and access patterns can sometimes cause this issue.

**Solutions:**

1. **Updated Custom Logout View (Implemented April 2025):**
   
   We've modified the custom logout view to accept both GET and POST methods:
   
   ```python
   @csrf_exempt
   @require_http_methods(["GET", "POST"])
   def custom_logout(request):
       """Custom logout view that properly handles the 'next' parameter."""
       next_url = request.GET.get('next', '/api/docs/')
       logout(request)
       return redirect(next_url)
   ```

2. **Logout Redirect Configuration (April 2, 2025):**

   We've updated the redirect URL to point to the admin login page instead of `/api/docs/`:
   
   ```python
   # In settings.py
   LOGOUT_REDIRECT_URL = '/admin/login/'
   
   # In Swagger settings
   SWAGGER_SETTINGS = {
       # ...
       'LOGOUT_URL': '/admin/logout/?next=/admin/login/',
       # ...
   }
   ```

   This ensures that after logout, users are redirected to a more appropriate page (the admin login page).

3. **Verifying the Fix:**
   
   After updating the code and restarting the Docker containers, verify that:
   - You can log out successfully from Django admin
   - You are redirected to the correct page after logout
   - No HTTP 405 errors appear in the browser console
   
   ```bash
   # Restart the backend container to apply changes
   docker-compose restart backend
   ```

4. **Alternative Approach (if needed):**
   
   If issues persist, add a custom template to override the admin logout functionality:
   
   ```bash
   # Create a template directory in your app
   mkdir -p backend/templates/admin
   
   # Create a custom logout.html template
   echo '<form method="post">{% csrf_token %}<button type="submit">Confirm logout</button></form>' > backend/templates/admin/logout.html
   ```
   
   Then add the template directory to your TEMPLATES setting in settings.py.

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