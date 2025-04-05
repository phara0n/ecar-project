"""
Wrapper for Swagger schema generation to handle serializer conflicts
"""

from drf_yasg.generators import OpenAPISchemaGenerator
from drf_yasg.inspectors import SwaggerAutoSchema
from rest_framework import serializers
from django.utils.encoding import force_str
import logging

logger = logging.getLogger(__name__)

class FixedSchemaGenerator(OpenAPISchemaGenerator):
    """
    Custom schema generator to handle serializer ref_name conflicts
    """
    def get_schema(self, request=None, public=False):
        """
        Generate a schema with unique serializer refs
        """
        try:
            # Generate the schema as normal
            schema = super().get_schema(request, public)
            
            # Track used schema names to avoid conflicts
            if 'components' in schema and 'schemas' in schema['components']:
                # Get dictionary of schemas
                schemas = schema['components']['schemas']
                
                # Create a dictionary to track renamed schemas
                renamed = {}
                
                # Handle conflicts by adding a prefix
                for name in list(schemas.keys()):
                    # Check if this name conflicts with a built-in model
                    if name in ['Car', 'Service', 'Customer', 'MileageUpdate', 'ServiceHistory']:
                        new_name = f"ECAR{name}"
                        if name in schemas:
                            schemas[new_name] = schemas.pop(name)
                            renamed[name] = new_name
                
                # Fix any references inside schemas
                for schema_obj in schemas.values():
                    self._fix_references_in_schema(schema_obj, renamed)
                    
            # Add additional metadata
            schema['info']['x-updated'] = "May 27, 2024"
            schema['info']['x-has-initial-mileage'] = True
            
            return schema
            
        except Exception as e:
            logger.error(f"Error generating schema: {str(e)}")
            # Create minimal valid schema on error
            return {
                "openapi": "3.0.0",
                "info": {
                    "title": "ECAR API (Error in Schema Generation)",
                    "version": "v1",
                    "description": f"Error generating full schema: {str(e)}. Please check the server logs."
                },
                "paths": {}
            }
            
    def _fix_references_in_schema(self, schema_obj, renamed):
        """
        Recursively fix references in schema objects
        """
        if isinstance(schema_obj, dict):
            # Check for $ref key first
            if '$ref' in schema_obj and isinstance(schema_obj['$ref'], str):
                ref = schema_obj['$ref']
                for old_name, new_name in renamed.items():
                    if f"#/components/schemas/{old_name}" in ref:
                        schema_obj['$ref'] = ref.replace(
                            f"#/components/schemas/{old_name}",
                            f"#/components/schemas/{new_name}"
                        )
            
            # Process all other keys
            for key, value in schema_obj.items():
                if isinstance(value, (dict, list)):
                    self._fix_references_in_schema(value, renamed)
        
        elif isinstance(schema_obj, list):
            for item in schema_obj:
                if isinstance(item, (dict, list)):
                    self._fix_references_in_schema(item, renamed)

class FixedAutoSchema(SwaggerAutoSchema):
    """
    Custom schema generator for viewsets that handles serializer conflicts better
    """
    def get_operation(self, operation_keys=None):
        """
        Override to handle circular references and naming conflicts better
        """
        try:
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
            
        except Exception as e:
            logger.error(f"Error generating operation: {str(e)}")
            # Return minimal valid operation on error
            return {
                "operationId": "error_operation",
                "description": f"Error generating operation: {str(e)}",
                "responses": {
                    "500": {
                        "description": "Error in schema generation"
                    }
                }
            } 