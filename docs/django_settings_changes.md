# Django Settings Changes Log

This document tracks important changes made to the Django settings file (`ecar_backend/settings.py`) to help maintain consistency across environments and facilitate troubleshooting.

## Latest Changes

### April 2, 2025

#### django-filter Configuration Fix

**Issue:** The Django admin and API filtering were not working properly due to incorrect django-filter configuration.

**Changes made:**
1. Changed the app name in `INSTALLED_APPS` from `'django_filter'` to `'django_filters'` (with an 's')
2. Updated the filter backend path in `REST_FRAMEWORK` settings from `'django_filter.rest_framework.DjangoFilterBackend'` to `'django_filters.rest_framework.DjangoFilterBackend'`

**Reason:** The django-filter package requires the app name to be specified as 'django_filters' (with an 's') in the `INSTALLED_APPS` setting, despite the pip package being named 'django-filter'. This is a common source of confusion that was causing the backend to fail.

**Result:** After the change, the Django admin interface and API filtering functionality work correctly.

## Previous Changes

### March 28, 2025

#### Added STATICFILES_DIRS

**Issue:** Static files were not being served correctly in development.

**Changes made:**
1. Added the `STATICFILES_DIRS` setting:
```python
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]
```

**Reason:** To ensure Django could find static files in the local development environment.

**Result:** Static files are now properly served in development.

### March 25, 2025

#### CORS Configuration

**Issue:** Frontend applications needed to access the API from different domains.

**Changes made:**
1. Added the corsheaders middleware to the `MIDDLEWARE` setting
2. Added CORS configuration:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://admin.ecar.tn",
    "https://mobile.ecar.tn",
]
CORS_ALLOW_CREDENTIALS = True
```

**Reason:** To allow frontend apps to make authenticated requests to the API.

**Result:** Frontend applications can now successfully communicate with the API. 