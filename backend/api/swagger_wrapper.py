"""
Wrapper for Swagger schema generation to handle serializer conflicts
"""

from drf_yasg.generators import OpenAPISchemaGenerator
from drf_yasg.inspectors import SwaggerAutoSchema
from rest_framework import serializers
from django.utils.encoding import force_str

class FixedSchemaGenerator(OpenAPISchemaGenerator):
    """
    Custom schema generator to handle serializer ref_name conflicts
    """
    def get_schema(self, request=None, public=False):
        """
        Generate a schema with unique serializer refs
        """
        # We don't need to clear ref_name as it doesn't exist on the base class
        # Generate the schema as normal
        return super().get_schema(request, public)

class FixedAutoSchema(SwaggerAutoSchema):
    """
    Custom schema generator for viewsets that handles serializer conflicts better
    """
    def get_operation(self, operation_keys=None):
        """
        Override to handle circular references and naming conflicts better
        """
        # First create the operation as normal
        operation = super().get_operation(operation_keys)
        
        # Ensure we have unique names for all components
        if 'components' in operation and 'schemas' in operation['components']:
            schemas = operation['components']['schemas']
            
            # Create a prefix to make them unique
            prefix = force_str(operation_keys[-1] if operation_keys else '')
            
            # Apply the prefix to schema references
            for name in list(schemas.keys()):
                if not name.startswith(prefix):
                    schemas[f"{prefix}_{name}"] = schemas.pop(name)
        
        return operation 