#!/usr/bin/env python
"""
Serializer Validation Script for ECAR Project

This script validates that all serializers correctly match their model fields and properties,
helping to prevent Swagger documentation generation errors.

Usage:
    python scripts/validate_serializers.py

Exit codes:
    0 - No issues found
    1 - Issues found (details printed to console)
"""
import os
import sys
import django

# Set up Django environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecar_backend.settings')
django.setup()

from api.serializers import (
    UserSerializer, CustomerSerializer, CarSerializer, 
    ServiceSerializer, ServiceItemSerializer, InvoiceSerializer, 
    NotificationSerializer, ServiceItemSwaggerSerializer,
    CarSwaggerSerializer
)
from core.models import Customer, Car, Service, ServiceItem, Invoice, Notification
from django.contrib.auth.models import User


def get_model_fields(model):
    """Get all field names from a model."""
    return [f.name for f in model._meta.fields]


def get_model_properties(model):
    """Get all property names from a model."""
    return [name for name in dir(model) if isinstance(getattr(model, name), property)]


def validate_serializer(serializer_class, verbose=True):
    """
    Validate that all fields in a serializer exist in the model or are explicitly defined.
    
    Args:
        serializer_class: The serializer class to validate
        verbose: Whether to print information about each serializer
        
    Returns:
        List of issues found
    """
    serializer = serializer_class()
    
    # Skip serializers without a model
    if not hasattr(serializer, 'Meta') or not hasattr(serializer.Meta, 'model'):
        if verbose:
            print(f"Skipping {serializer_class.__name__} - no model defined")
        return []
        
    model = serializer.Meta.model
    model_fields = get_model_fields(model)
    model_properties = get_model_properties(model)
    valid_names = set(model_fields + model_properties)
    
    # Common fields that are handled specially by DRF
    valid_names.add('id')
    
    # Get explicitly declared fields
    declared_fields = set(serializer._declared_fields.keys())
    
    issues = []
    
    # Check that all fields in the serializer exist in the model or are declared
    for field_name in serializer.Meta.fields:
        if field_name not in valid_names and field_name not in declared_fields:
            issues.append(f"Field '{field_name}' not found in {model.__name__}")
            
    # Check for relationships that might need explicit declaration
    for field_name in model_fields:
        field = model._meta.get_field(field_name)
        if hasattr(field, 'related_model') and field.related_model:
            if field_name in serializer.Meta.fields and field_name not in declared_fields:
                issues.append(f"Warning: Relationship field '{field_name}' may need explicit declaration")
    
    return issues


def check_all_serializers():
    """Check all serializers and return whether any issues were found."""
    serializers_to_check = [
        UserSerializer,
        CustomerSerializer,
        CarSerializer,
        ServiceSerializer,
        ServiceItemSerializer,
        InvoiceSerializer,
        NotificationSerializer,
        ServiceItemSwaggerSerializer,
        CarSwaggerSerializer
    ]
    
    has_issues = False
    
    print("ECAR Serializer Validation")
    print("=" * 30)
    
    for serializer in serializers_to_check:
        issues = validate_serializer(serializer)
        
        if issues:
            has_issues = True
            print(f"\nIssues in {serializer.__name__}:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"✓ {serializer.__name__} - No issues")
    
    return has_issues


if __name__ == "__main__":
    has_issues = check_all_serializers()
    sys.exit(1 if has_issues else 0) 