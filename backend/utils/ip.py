"""
Utility functions for handling IP addresses
"""

def get_client_ip(request):
    """
    Get client IP address from request
    
    This function extracts the client IP address from the HTTP request.
    It first checks for the X-Forwarded-For header (used by proxies),
    then falls back to REMOTE_ADDR if not available.
    
    Args:
        request: The HTTP request object
        
    Returns:
        str: The client IP address or 'unknown' if not found
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip 