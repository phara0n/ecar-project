# Backend Improvement Implementation Plan

## Overview

This document outlines the detailed implementation plan for improving the backend of the ECAR Garage Management System based on the compliance analysis. The plan is structured into phases with specific tasks, estimated timelines, and implementation details.

## Phase 1: Core Structure and Security Improvements

### 1.1 Restructure Utility Functions (2 days)

**Tasks:**
1. Create a dedicated `utils` package
2. Migrate existing utility functions from `core/utils.py`
3. Create specialized utility modules:
   - `email_utils.py`
   - `pdf_utils.py`
   - `encryption_utils.py`
   - `cache_utils.py`

**Implementation Details:**
```bash
# Create directory structure
mkdir -p backend/utils

# Create package files
touch backend/utils/__init__.py
touch backend/utils/email_utils.py
touch backend/utils/pdf_utils.py
touch backend/utils/encryption_utils.py
touch backend/utils/cache_utils.py
```

**Code Changes:**
- Move email-related functions to `email_utils.py`
- Move PDF generation to `pdf_utils.py`
- Create encryption utilities in `encryption_utils.py`
- Move caching functions to `cache_utils.py`
- Update imports in all affected files

### 1.2 Implement AES-256 Encryption (3 days)

**Tasks:**
1. Create encryption utilities
2. Add necessary dependencies
3. Modify models to use encrypted fields
4. Create migration for encrypted fields
5. Write data migration script to encrypt existing data

**Dependencies:**
```
cryptography==41.0.5
```

**Implementation Details:**
```python
# utils/encryption_utils.py
from cryptography.fernet import Fernet
import base64
import os
from django.conf import settings

def get_encryption_key():
    """Get or generate an encryption key."""
    key = os.environ.get('ENCRYPTION_KEY', settings.SECRET_KEY)
    # Ensure key is of correct length for Fernet (32 bytes)
    return base64.urlsafe_b64encode(key.ljust(32)[:32].encode())

def encrypt_data(data):
    """Encrypt sensitive data."""
    if not data:
        return None
    f = Fernet(get_encryption_key())
    return f.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data):
    """Decrypt sensitive data."""
    if not encrypted_data:
        return None
    f = Fernet(get_encryption_key())
    return f.decrypt(encrypted_data.encode()).decode()
```

**Model Changes:**
```python
# models.py - Customer model
from utils.encryption_utils import encrypt_data, decrypt_data

class Customer(models.Model):
    # Existing fields
    name = models.CharField(max_length=100)
    email = models.EmailField()
    
    # Replace direct phone field with encrypted version
    _encrypted_phone = models.TextField(null=True, blank=True)
    _encrypted_address = models.TextField(null=True, blank=True)
    
    @property
    def phone(self):
        return decrypt_data(self._encrypted_phone)
        
    @phone.setter
    def phone(self, value):
        self._encrypted_phone = encrypt_data(value)
        
    @property
    def address(self):
        return decrypt_data(self._encrypted_address)
        
    @address.setter
    def address(self, value):
        self._encrypted_address = encrypt_data(value)
```

**Migration Script:**
```python
# Create migration: python manage.py makemigrations core --name encrypt_sensitive_data

# Use data migration to encrypt existing data
from django.db import migrations
from utils.encryption_utils import encrypt_data

def encrypt_existing_data(apps, schema_editor):
    Customer = apps.get_model('core', 'Customer')
    
    for customer in Customer.objects.all():
        # Get plaintext data
        phone = customer.phone
        address = customer.address
        
        # Store encrypted data
        customer._encrypted_phone = encrypt_data(phone) if phone else None
        customer._encrypted_address = encrypt_data(address) if address else None
        customer.save()

class Migration(migrations.Migration):
    dependencies = [
        ('core', 'previous_migration'),
    ]
    
    operations = [
        migrations.RunPython(encrypt_existing_data),
    ]
```

### 1.3 PostgreSQL Database Migration (2 days)

**Tasks:**
1. Update settings for PostgreSQL
2. Install required dependencies
3. Create migration script
4. Test data migration
5. Update Docker configuration

**Dependencies:**
```
psycopg2-binary==2.9.10
```

**Implementation Details:**
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ecar_db'),
        'USER': os.environ.get('DB_USER', 'ecar_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'db'),  # Match docker-compose service name
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}
```

**Docker Configuration Updates:**
```yaml
# docker-compose.yml
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy
    env_file:
      - ./.env
    environment:
      - DB_HOST=db
      - DB_PORT=5432
```

**Migration Command:**
```bash
# Export data from SQLite (if needed)
python manage.py dumpdata > data.json

# Apply migrations to PostgreSQL
python manage.py migrate

# Load data into PostgreSQL (if needed)
python manage.py loaddata data.json
```

## Phase 2: Additional Components and Documentation

### 2.1 Sentry Integration for Error Monitoring (1 day)

**Tasks:**
1. Add Sentry SDK to requirements
2. Configure Sentry in settings.py
3. Test error reporting

**Dependencies:**
```
sentry-sdk==1.39.2
```

**Implementation Details:**
```python
# settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DSN", ""),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False
    )
```

### 2.2 Automated Backup System (2 days)

**Tasks:**
1. Create backup utilities
2. Implement management command
3. Set up cron job for daily backups
4. Configure SFTP export for off-site backups

**Implementation Details:**
```python
# utils/backup_utils.py
import os
import datetime
import subprocess
import paramiko
from django.conf import settings

def create_database_backup():
    """Create a PostgreSQL database backup."""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    
    backup_file = os.path.join(backup_dir, f'ecar_db_backup_{timestamp}.sql')
    
    # Get DB settings from Django
    db_settings = settings.DATABASES['default']
    
    # Create backup command
    cmd = [
        'pg_dump',
        f'--host={db_settings["HOST"]}',
        f'--port={db_settings["PORT"]}',
        f'--username={db_settings["USER"]}',
        f'--dbname={db_settings["NAME"]}',
        '--format=custom',
        f'--file={backup_file}'
    ]
    
    # Set PGPASSWORD environment variable
    env = os.environ.copy()
    env['PGPASSWORD'] = db_settings['PASSWORD']
    
    # Execute backup command
    result = subprocess.run(cmd, env=env, capture_output=True)
    
    if result.returncode != 0:
        raise Exception(f"Backup failed: {result.stderr.decode()}")
    
    return backup_file

def upload_backup_to_sftp(local_file):
    """Upload backup file to SFTP server."""
    try:
        host = settings.BACKUP_SFTP_HOST
        port = settings.BACKUP_SFTP_PORT
        username = settings.BACKUP_SFTP_USER
        password = settings.BACKUP_SFTP_PASSWORD
        remote_dir = settings.BACKUP_SFTP_DIRECTORY
        
        transport = paramiko.Transport((host, port))
        transport.connect(username=username, password=password)
        
        sftp = paramiko.SFTPClient.from_transport(transport)
        
        # Create remote directory if it doesn't exist
        try:
            sftp.stat(remote_dir)
        except IOError:
            sftp.mkdir(remote_dir)
        
        # Upload file
        remote_file = os.path.join(remote_dir, os.path.basename(local_file))
        sftp.put(local_file, remote_file)
        
        sftp.close()
        transport.close()
        
        return remote_file
    except Exception as e:
        raise Exception(f"SFTP upload failed: {str(e)}")
```

**Management Command:**
```python
# core/management/commands/create_backup.py
from django.core.management.base import BaseCommand
from utils.backup_utils import create_database_backup, upload_backup_to_sftp

class Command(BaseCommand):
    help = 'Creates a database backup and optionally uploads it to SFTP'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--upload',
            action='store_true',
            help='Upload backup to SFTP server',
        )
    
    def handle(self, *args, **options):
        try:
            self.stdout.write('Creating database backup...')
            backup_file = create_database_backup()
            self.stdout.write(self.style.SUCCESS(f'Backup created: {backup_file}'))
            
            if options['upload']:
                self.stdout.write('Uploading backup to SFTP...')
                remote_file = upload_backup_to_sftp(backup_file)
                self.stdout.write(self.style.SUCCESS(f'Backup uploaded: {remote_file}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Backup failed: {str(e)}'))
```

**Cron Job Setup:**
```bash
# Add to crontab
# Run backup daily at 2 AM
0 2 * * * cd /path/to/ecar_project && /path/to/venv/bin/python manage.py create_backup --upload
```

### 2.3 Enhanced API Documentation (1 day)

**Tasks:**
1. Add drf-yasg to requirements
2. Configure Swagger/ReDoc in settings and URLs
3. Add documentation to API endpoints

**Dependencies:**
```
drf-yasg==1.21.7
```

**Implementation Details:**
```python
# settings.py
INSTALLED_APPS = [
    # ...
    'drf_yasg',
    # ...
]
```

**URL Configuration:**
```python
# urls.py
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

schema_view = get_schema_view(
   openapi.Info(
      title="ECAR API",
      default_version='v1',
      description="ECAR Garage Management System API",
      contact=openapi.Contact(email="admin@ecar.tn"),
      license=openapi.License(name="Proprietary"),
   ),
   public=True,
   permission_classes=[permissions.IsAuthenticated],
)

urlpatterns = [
    # ...
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # ...
]
```

**Example API Documentation:**
```python
# views.py
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing customers.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get a list of all customers",
        responses={
            200: CustomerSerializer(many=True),
            401: "Authentication credentials were not provided."
        }
    )
    def list(self, request):
        return super().list(request)
    
    @swagger_auto_schema(
        operation_description="Create a new customer",
        request_body=CustomerSerializer,
        responses={
            201: CustomerSerializer,
            400: "Bad request",
            401: "Authentication credentials were not provided."
        }
    )
    def create(self, request):
        return super().create(request)
```

## Phase 3: Additional Enhancements

### 3.1 SMS Gateway Integration (2 days)

**Tasks:**
1. Research Tunisian SMS gateway providers
2. Create SMS utility module
3. Add settings for SMS gateway credentials
4. Implement SMS notification functions

**Implementation Details:**
```python
# settings.py
# SMS Gateway settings
SMS_API_KEY = os.environ.get('SMS_API_KEY', '')
SMS_SENDER_ID = os.environ.get('SMS_SENDER_ID', 'ECAR')
```

```python
# utils/sms_utils.py
import requests
from django.conf import settings

def send_sms(phone_number, message):
    """Send SMS using Tunisian SMS gateway."""
    api_key = settings.SMS_API_KEY
    sender_id = settings.SMS_SENDER_ID
    
    url = "https://api.tunisiansmsgateway.com/send"  # Replace with actual gateway URL
    
    payload = {
        "api_key": api_key,
        "sender_id": sender_id,
        "phone": phone_number,
        "message": message
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code != 200:
        raise Exception(f"SMS sending failed: {response.text}")
    
    return response.json()

def send_appointment_reminder(appointment):
    """Send appointment reminder via SMS."""
    customer = appointment.customer
    message = f"Rappel: Votre rendez-vous chez ECAR Garage est prévu pour le {appointment.date.strftime('%d/%m/%Y')} à {appointment.time}. Pour toute question, appelez le 123456789."
    
    return send_sms(customer.phone, message)

def send_service_completion_notification(service):
    """Send service completion notification via SMS."""
    customer = service.vehicle.owner
    message = f"Votre véhicule {service.vehicle.make} {service.vehicle.model} est prêt à être récupéré chez ECAR Garage. Le coût total du service est de {service.total_cost} TND."
    
    return send_sms(customer.phone, message)
```

### 3.2 Service Layer Implementation (3 days)

**Tasks:**
1. Create service layer directory structure
2. Implement service classes for core functionality
3. Refactor views to use service layer
4. Add proper error handling and logging

**Implementation Details:**
```
backend/
├── services/               # Service layer directory
│   ├── __init__.py
│   ├── customer_service.py
│   ├── vehicle_service.py
│   ├── service_service.py
│   ├── invoice_service.py
│   └── appointment_service.py
```

**Example Service Implementation:**
```python
# services/customer_service.py
from core.models import Customer
from utils.encryption_utils import encrypt_data, decrypt_data

class CustomerService:
    @staticmethod
    def get_all_customers():
        """Get all customers."""
        return Customer.objects.all()
    
    @staticmethod
    def get_customer_by_id(customer_id):
        """Get customer by ID."""
        try:
            return Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return None
    
    @staticmethod
    def create_customer(customer_data):
        """Create a new customer."""
        customer = Customer(
            name=customer_data['name'],
            email=customer_data['email'],
        )
        
        # Handle encrypted fields
        if 'phone' in customer_data:
            customer.phone = customer_data['phone']
        
        if 'address' in customer_data:
            customer.address = customer_data['address']
            
        customer.save()
        return customer
    
    @staticmethod
    def update_customer(customer_id, customer_data):
        """Update an existing customer."""
        customer = CustomerService.get_customer_by_id(customer_id)
        if not customer:
            return None
            
        if 'name' in customer_data:
            customer.name = customer_data['name']
            
        if 'email' in customer_data:
            customer.email = customer_data['email']
            
        if 'phone' in customer_data:
            customer.phone = customer_data['phone']
            
        if 'address' in customer_data:
            customer.address = customer_data['address']
            
        customer.save()
        return customer
```

**Refactored Views:**
```python
# views.py
from services.customer_service import CustomerService

class CustomerViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        customers = CustomerService.get_all_customers()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        customer = CustomerService.get_customer_by_id(pk)
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
            
        serializer = CustomerSerializer(customer)
        return Response(serializer.data)
    
    def create(self, request):
        serializer = CustomerSerializer(data=request.data)
        if serializer.is_valid():
            customer = CustomerService.create_customer(serializer.validated_data)
            return Response(CustomerSerializer(customer).data, status=201)
        return Response(serializer.errors, status=400)
    
    def update(self, request, pk=None):
        serializer = CustomerSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            customer = CustomerService.update_customer(pk, serializer.validated_data)
            if not customer:
                return Response({'error': 'Customer not found'}, status=404)
                
            return Response(CustomerSerializer(customer).data)
        return Response(serializer.errors, status=400)
```

## Implementation Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| **Phase 1** | **Core Structure and Security** | **7 days** | |
| 1.1 | Restructure Utility Functions | 2 days | None |
| 1.2 | Implement AES-256 Encryption | 3 days | Cryptography library |
| 1.3 | PostgreSQL Database Migration | 2 days | Psycopg2 |
| **Phase 2** | **Additional Components** | **4 days** | |
| 2.1 | Sentry Integration | 1 day | Sentry SDK |
| 2.2 | Automated Backup System | 2 days | Paramiko |
| 2.3 | Enhanced API Documentation | 1 day | DRF-YASG |
| **Phase 3** | **Additional Enhancements** | **5 days** | |
| 3.1 | SMS Gateway Integration | 2 days | Requests |
| 3.2 | Service Layer Implementation | 3 days | None |

## Conclusion

This implementation plan provides a detailed roadmap for enhancing the ECAR Garage Management System backend to fully comply with the project requirements and coding rules. The plan is structured to prioritize critical security and structural improvements first, followed by additional components and enhancements. Total estimated implementation time is 16 working days, with most critical improvements completed within the first 7 days.