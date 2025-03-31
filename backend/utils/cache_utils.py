from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json

# Default cache timeout (15 minutes)
DEFAULT_CACHE_TIMEOUT = getattr(settings, 'CACHE_TTL', 60 * 15)

def generate_cache_key(prefix, args=None, kwargs=None):
    """
    Generate a consistent cache key based on a prefix and arguments.
    
    Args:
        prefix (str): A prefix for the cache key
        args (tuple, optional): Positional arguments to include in the key
        kwargs (dict, optional): Keyword arguments to include in the key
        
    Returns:
        str: A cache key string
    """
    key_parts = [prefix]
    
    # Add args to key if provided
    if args:
        key_parts.extend([str(arg) for arg in args])
    
    # Add kwargs to key if provided, sorted by key for consistency
    if kwargs:
        for k in sorted(kwargs.keys()):
            key_parts.append(f"{k}:{kwargs[k]}")
    
    # Join parts and hash if the key would be too long
    key = ":".join(key_parts)
    if len(key) > 250:  # Redis keys should be kept reasonably short
        key = f"{prefix}:{hashlib.md5(key.encode()).hexdigest()}"
        
    return key

def cache_result(timeout=None):
    """
    Decorator to cache function results.
    
    Args:
        timeout (int, optional): Cache timeout in seconds. Defaults to settings.CACHE_TTL.
        
    Returns:
        callable: Decorated function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate a cache key
            cache_key = generate_cache_key(
                f"func:{func.__module__}:{func.__name__}",
                args,
                kwargs
            )
            
            # Try to get cached result
            result = cache.get(cache_key)
            
            # If not cached, call the function and cache the result
            if result is None:
                result = func(*args, **kwargs)
                cache_timeout = timeout or DEFAULT_CACHE_TIMEOUT
                cache.set(cache_key, result, timeout=cache_timeout)
                
            return result
        return wrapper
    return decorator

def invalidate_cache_for_model(model_name, instance_id=None):
    """
    Invalidate cache for a specific model or instance.
    
    Args:
        model_name (str): The model name to invalidate cache for
        instance_id (int, optional): Specific instance ID to invalidate
        
    Returns:
        bool: True if cache was invalidated, False otherwise
    """
    if instance_id:
        # Invalidate for specific instance
        cache_key_pattern = f"*:{model_name}:*:{instance_id}:*"
        return cache.delete_pattern(cache_key_pattern)
    else:
        # Invalidate for all instances of this model
        cache_key_pattern = f"*:{model_name}:*"
        return cache.delete_pattern(cache_key_pattern)

def get_or_set_cache(key, getter_func, timeout=None):
    """
    Get a value from cache or set it if it doesn't exist.
    
    Args:
        key (str): Cache key
        getter_func (callable): Function to call if cache misses
        timeout (int, optional): Cache timeout in seconds
        
    Returns:
        Any: The cached or newly retrieved value
    """
    result = cache.get(key)
    
    if result is None:
        result = getter_func()
        cache_timeout = timeout or DEFAULT_CACHE_TIMEOUT
        cache.set(key, result, timeout=cache_timeout)
        
    return result

def clear_cache():
    """
    Clear the entire cache. Use with caution.
    
    Returns:
        bool: True if cache was cleared successfully
    """
    return cache.clear()

def cache_queryset(queryset, prefix, timeout=None):
    """
    Cache a Django queryset result.
    
    Args:
        queryset: Django queryset to cache
        prefix (str): A prefix for the cache key
        timeout (int, optional): Cache timeout in seconds
        
    Returns:
        list: The queryset results
    """
    # Create a key based on the query
    query_str = str(queryset.query)
    cache_key = generate_cache_key(f"qs:{prefix}", args=[query_str])
    
    # Try to get from cache
    result = cache.get(cache_key)
    
    # If not in cache, execute the query and cache the result
    if result is None:
        result = list(queryset)
        cache_timeout = timeout or DEFAULT_CACHE_TIMEOUT
        cache.set(cache_key, result, timeout=cache_timeout)
    
    return result
