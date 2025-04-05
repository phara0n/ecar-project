"""
Utility functions to help with Swagger documentation
This module prevents circular imports when handling documentation serializers
"""

import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

@lru_cache(maxsize=32)
def get_docs_serializer(serializer_name):
    """
    Safely get a documentation serializer by name without causing circular imports.
    
    Args:
        serializer_name (str): The name of the serializer class to fetch
    
    Returns:
        Serializer class or None: The requested documentation serializer or None if not found
    """
    try:
        from .swagger_schemas import (
            UserDocsSerializer, CustomerDocsSerializer, CarDocsSerializer,
            ServiceDocsSerializer, ServiceItemDocsSerializer, InvoiceDocsSerializer,
            NotificationDocsSerializer, MileageUpdateDocsSerializer,
            ServiceIntervalDocsSerializer, ServiceHistoryDocsSerializer
        )
        
        serializers = {
            'UserDocsSerializer': UserDocsSerializer,
            'CustomerDocsSerializer': CustomerDocsSerializer,
            'CarDocsSerializer': CarDocsSerializer,
            'ServiceDocsSerializer': ServiceDocsSerializer,
            'ServiceItemDocsSerializer': ServiceItemDocsSerializer,
            'InvoiceDocsSerializer': InvoiceDocsSerializer,
            'NotificationDocsSerializer': NotificationDocsSerializer,
            'MileageUpdateDocsSerializer': MileageUpdateDocsSerializer,
            'ServiceIntervalDocsSerializer': ServiceIntervalDocsSerializer,
            'ServiceHistoryDocsSerializer': ServiceHistoryDocsSerializer,
        }
        
        return serializers.get(serializer_name)
    except ImportError as e:
        logger.error(f"Error importing documentation serializer {serializer_name}: {str(e)}")
        return None

def get_mileage_update_docs_serializer():
    """
    Convenience method to get the MileageUpdateDocsSerializer
    """
    return get_docs_serializer('MileageUpdateDocsSerializer')

def get_car_docs_serializer():
    """
    Convenience method to get the CarDocsSerializer
    """
    return get_docs_serializer('CarDocsSerializer')

def get_service_docs_serializer():
    """
    Convenience method to get the ServiceDocsSerializer
    """
    return get_docs_serializer('ServiceDocsSerializer') 