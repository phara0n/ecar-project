# ECAR Project Dependencies

This document lists all the dependencies required for the ECAR project, including those that needed to be installed manually during development.

## Core Dependencies

| Package Name | Version | Purpose |
|--------------|---------|---------|
| Django | 5.1.7+ | Web framework for backend development |
| djangorestframework | 3.16.0+ | REST API framework for Django |
| drf-yasg | 1.21.10+ | Swagger/OpenAPI documentation for Django REST Framework |
| django-filter | 25.1+ | Advanced filtering for Django querysets |
| PyYAML | 6.0.2+ | YAML parsing for configuration files |
| inflection | 0.5.1+ | String transformation library (used by drf-yasg) |
| uritemplate | 4.1.1+ | URI template parsing (used by drf-yasg) |
| pytz | 2025.2+ | Timezone library |

## Authentication Dependencies

| Package Name | Version | Purpose |
|--------------|---------|---------|
| djangorestframework-simplejwt | Latest | JWT authentication for Django REST Framework |

## Database Dependencies

| Package Name | Version | Purpose |
|--------------|---------|---------|
| psycopg2-binary | Latest | PostgreSQL adapter for Python |

## Development Dependencies

| Package Name | Version | Purpose |
|--------------|---------|---------|
| django-debug-toolbar | Latest | Debug toolbar for development |

## Manual Installation Instructions

If you encounter missing dependencies when running the local server, you can install them using the following commands:

```bash
# Activate the virtual environment
cd /home/ecar/ecar_project/backend
source .venv/bin/activate

# Install required packages
pip install django-filter
pip install drf-yasg

# You can also install all dependencies from requirements.txt
pip install -r requirements.txt
```

## Docker Environment Dependencies

For Docker deployment, ensure the following dependencies are included in the requirements.txt file or installed in the Dockerfile:

```
django>=5.1.7
djangorestframework>=3.16.0
drf-yasg>=1.21.10
django-filter>=25.1
PyYAML>=6.0.2
inflection>=0.5.1
uritemplate>=4.1.1
pytz>=2025.2
djangorestframework-simplejwt
psycopg2-binary
```

## Troubleshooting Dependencies

If you encounter errors related to missing dependencies, check the following:

1. Ensure the virtual environment is activated
2. Check if the package is installed using `pip list`
3. Try reinstalling the package with `pip install --force-reinstall <package_name>`
4. Check for any conflicts with other installed packages
5. Verify that the package version is compatible with your Python version

For Docker environments, you may need to rebuild the container after updating dependencies:

```bash
docker-compose build backend
docker-compose up -d
``` 