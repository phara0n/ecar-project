#!/usr/bin/env python
"""
A simple test script to check if drf-yasg is working properly
"""
import os
import sys

# Try to import drf-yasg
try:
    import drf_yasg
    print(f"drf-yasg version: {drf_yasg.__version__}")
    print("drf-yasg is installed correctly!")
except ImportError as e:
    print(f"Error importing drf-yasg: {e}")
    sys.exit(1)

# Try to create a schema and see if it works
try:
    from drf_yasg import openapi
    
    info = openapi.Info(
        title="Test API",
        default_version='v1',
        description="Test API description",
    )
    
    print("Successfully created schema info object")
    print(f"Info: {info}")
    
except Exception as e:
    print(f"Error creating schema: {e}")
    sys.exit(1)

print("All tests passed! drf-yasg should be working correctly.") 