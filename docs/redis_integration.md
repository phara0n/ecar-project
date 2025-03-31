# Redis Integration

## Overview

The ECAR Garage Management System integrates Redis for caching and performance optimization. This document outlines the implementation details, configuration, and best practices for using Redis within the application.

## Implementation

### Docker Configuration

Redis is configured in `docker-compose.yml`:

```yaml
redis:
  image: redis:7.2-alpine
  volumes:
    - redis_data:/data
  ports:
    - "6379:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Django Settings

The Redis connection is configured in `settings.py`:

```python
# Redis configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/1')

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PARSER_CLASS': 'redis.connection.HiredisParser',
        }
    }
}
```

## Use Cases

### API Response Caching

API responses are cached to improve performance:

```python
@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class VehicleListView(generics.ListAPIView):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)
```

### Model Data Caching

Frequently accessed model data is cached:

```python
def get_customer_vehicles(customer_id):
    cache_key = f'customer_vehicles_{customer_id}'
    vehicles = cache.get(cache_key)
    
    if not vehicles:
        vehicles = list(Vehicle.objects.filter(owner_id=customer_id))
        cache.set(cache_key, vehicles, timeout=3600)  # Cache for 1 hour
        
    return vehicles
```

### Cache Invalidation

Cache is invalidated when data is updated:

```python
def update_vehicle(vehicle_id, data):
    vehicle = Vehicle.objects.get(id=vehicle_id)
    # Update vehicle fields
    vehicle.save()
    
    # Invalidate cache
    cache_key = f'customer_vehicles_{vehicle.owner_id}'
    cache.delete(cache_key)
    
    return vehicle
```

## Performance Benefits

Redis caching provides several performance improvements:

1. **Reduced Database Load**: Frequently accessed data is retrieved from Redis instead of hitting the database
2. **Faster API Responses**: Cached API responses are returned without database queries
3. **Improved Scalability**: Redis can handle high throughput with minimal latency

## Maintenance and Monitoring

### Cache Monitoring

Monitor Redis performance using:

```bash
redis-cli info
```

Key metrics to watch:
- `used_memory`: Memory usage
- `keyspace_hits` vs `keyspace_misses`: Cache hit ratio
- `connected_clients`: Number of clients

### Cache Clearing

Clear the entire cache:

```python
from django.core.cache import cache
cache.clear()
```

Clear specific keys:

```python
cache.delete_pattern('customer_vehicles_*')
```

## Best Practices

1. **Set Appropriate TTL**: Choose cache timeout values based on data volatility
2. **Cache Selectively**: Cache only frequently accessed data
3. **Implement Proper Invalidation**: Clear cache when data changes
4. **Monitor Memory Usage**: Watch Redis memory consumption
5. **Use Consistent Key Naming**: Follow a naming convention for cache keys

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**: Check Redis service is running and accessible
2. **Memory Issues**: Monitor Redis memory usage and consider increasing max memory
3. **Stale Data**: Verify cache invalidation logic is working correctly
4. **Performance Degradation**: Check Redis server load and connection pool settings 