# PostgreSQL Performance Optimization

This document outlines strategies for optimizing PostgreSQL performance in the ECAR Garage Management System.

## Database Configuration

### Connection Pooling

Connection pooling reduces the overhead of creating new database connections by maintaining a pool of open connections that can be reused.

1. **PgBouncer Setup**

   ```bash
   # Install PgBouncer
   sudo apt-get install pgbouncer

   # Configure PgBouncer
   sudo nano /etc/pgbouncer/pgbouncer.ini
   ```

   Basic configuration:
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
   ```

2. **Django Configuration**

   Update settings to connect via PgBouncer:

   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': os.environ.get('DB_NAME', 'ecar_db'),
           'USER': os.environ.get('DB_USER', 'ecar_user'),
           'PASSWORD': os.environ.get('DB_PASSWORD', 'ecar_password'),
           'HOST': os.environ.get('DB_HOST', 'localhost'),
           'PORT': os.environ.get('DB_PORT', '6432'),  # PgBouncer port
           'CONN_MAX_AGE': 0,  # Let PgBouncer handle connection pooling
       }
   }
   ```

## Query Optimization

### Indexing Strategy

Proper indexing is crucial for query performance. Consider these indexing strategies:

1. **Basic Indexing Rules**
   - Index foreign key fields
   - Index fields used in WHERE clauses
   - Index fields used in ORDER BY clauses
   - Create compound indexes for frequently combined fields

2. **Common Indexes for ECAR System**

   ```python
   # Add to models.py or in a migration
   
   # For Vehicle model
   models.Index(fields=['license_plate']),
   models.Index(fields=['vin']),
   
   # For Service model
   models.Index(fields=['status']),
   models.Index(fields=['created_at']),
   models.Index(fields=['completed_date']),
   models.Index(fields=['customer', 'status']),
   
   # For Invoice model
   models.Index(fields=['created_at']),
   models.Index(fields=['due_date']),
   models.Index(fields=['status']),
   ```

3. **Text Search Indexes**

   For search functionality, implement PostgreSQL full-text search:

   ```python
   # Example for Customer model
   from django.contrib.postgres.indexes import GinIndex
   from django.contrib.postgres.search import SearchVectorField

   class Customer(models.Model):
       # existing fields...
       search_vector = SearchVectorField(null=True)

       class Meta:
           indexes = [
               GinIndex(fields=['search_vector']),
           ]
   ```

### Query Analysis Tools

1. **Django Debug Toolbar**

   Install and configure:
   ```bash
   pip install django-debug-toolbar
   ```

   Add to settings:
   ```python
   INSTALLED_APPS += ['debug_toolbar']
   MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
   INTERNAL_IPS = ['127.0.0.1']
   ```

2. **pg_stat_statements**

   Enable the extension:
   ```sql
   CREATE EXTENSION pg_stat_statements;
   ```

   Query to find slow queries:
   ```sql
   SELECT 
       query, 
       calls, 
       total_time, 
       total_time / calls as avg_time, 
       rows
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 10;
   ```

## Caching Strategies

### Model-Level Caching

```python
from django.core.cache import cache

def get_customer_with_cache(customer_id):
    cache_key = f'customer_{customer_id}'
    customer = cache.get(cache_key)
    if not customer:
        customer = Customer.objects.get(id=customer_id)
        cache.set(cache_key, customer, timeout=3600)  # Cache for 1 hour
    return customer
```

### QuerySet Caching

```python
from django.core.cache import cache

def get_active_services_with_cache():
    cache_key = 'active_services'
    services = cache.get(cache_key)
    if not services:
        services = list(Service.objects.filter(status='in_progress'))
        cache.set(cache_key, services, timeout=300)  # Cache for 5 minutes
    return services
```

### Cache Invalidation

```python
def invalidate_customer_cache(customer_id):
    cache_key = f'customer_{customer_id}'
    cache.delete(cache_key)
```

### Django REST Framework Caching

Add caching to DRF views:

```python
from rest_framework.decorators import api_view
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class CustomerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    @method_decorator(cache_page(60 * 15))  # Cache for 15 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
```

## Database Maintenance

### Regular Maintenance Tasks

Set up a cron job for regular maintenance:

```bash
# Create a maintenance script
cat > /home/ecar/ecar_project/backend/scripts/db_maintenance.sh << 'EOF'
#!/bin/bash
PGPASSWORD="ecar_password" psql -U ecar_user -d ecar_db -c "VACUUM ANALYZE;"
PGPASSWORD="ecar_password" psql -U ecar_user -d ecar_db -c "REINDEX DATABASE ecar_db;"
EOF

# Make it executable
chmod +x /home/ecar/ecar_project/backend/scripts/db_maintenance.sh

# Add to crontab (runs every Sunday at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * 0 /home/ecar/ecar_project/backend/scripts/db_maintenance.sh") | crontab -
```

### Monitoring Queries

Create a Django management command to identify slow queries:

```python
# backend/core/management/commands/slow_queries.py
from django.core.management.base import BaseCommand
import psycopg2

class Command(BaseCommand):
    help = 'Identify slow queries in the database'

    def handle(self, *args, **options):
        conn = psycopg2.connect(
            dbname="ecar_db",
            user="ecar_user",
            password="ecar_password",
            host="localhost"
        )
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT query, calls, total_time, mean_time, rows
            FROM pg_stat_statements
            ORDER BY mean_time DESC
            LIMIT 10;
        """)
        
        self.stdout.write(self.style.SUCCESS('Top 10 slowest queries:'))
        for query in cursor.fetchall():
            self.stdout.write(f"Query: {query[0][:100]}...")
            self.stdout.write(f"Calls: {query[1]}")
            self.stdout.write(f"Total time: {query[2]} ms")
            self.stdout.write(f"Mean time: {query[3]} ms")
            self.stdout.write(f"Rows: {query[4]}")
            self.stdout.write("-" * 80)
```

## Application-Level Optimizations

### Select Related and Prefetch Related

```python
# Instead of this:
services = Service.objects.filter(status='in_progress')
for service in services:
    customer = service.customer  # Database hit for each service

# Use this:
services = Service.objects.filter(status='in_progress').select_related('customer')
for service in services:
    customer = service.customer  # No additional database hit
```

### Bulk Operations

```python
# Instead of this:
for customer_id in customer_ids:
    Notification.objects.create(
        customer_id=customer_id,
        message="Your service is complete"
    )

# Use this:
notifications = [
    Notification(customer_id=customer_id, message="Your service is complete")
    for customer_id in customer_ids
]
Notification.objects.bulk_create(notifications)
```

## Conclusion

Implementing these PostgreSQL performance optimization strategies will ensure the ECAR Garage Management System remains responsive and efficient as it scales. Regular monitoring and maintenance are key to sustained performance. 