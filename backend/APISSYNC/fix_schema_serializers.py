#!/usr/bin/env python3
"""
Fix Schema Serializers

This script ensures that serializers in swagger_schemas.py are up-to-date with models.py.
It compares the fields in models.py with the serializers in swagger_schemas.py and updates
them if needed.

Usage:
    python3 fix_schema_serializers.py

"""

import os
import re
import sys
import difflib
from datetime import datetime


class SchemaSerializer:
    def __init__(self, project_root):
        self.project_root = project_root
        self.backend_dir = os.path.join(project_root, 'backend')
        self.api_dir = os.path.join(self.backend_dir, 'api')
        self.core_dir = os.path.join(self.backend_dir, 'core')
        self.timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        # Load model definitions
        models_file = os.path.join(self.core_dir, 'models.py')
        if os.path.exists(models_file):
            with open(models_file, 'r') as f:
                self.models_content = f.read()
        else:
            print(f"Error: {models_file} not found")
            sys.exit(1)
            
        # Load swagger schema file
        schemas_file = os.path.join(self.api_dir, 'swagger_schemas.py')
        if os.path.exists(schemas_file):
            with open(schemas_file, 'r') as f:
                self.schemas_content = f.read()
        else:
            print(f"Error: {schemas_file} not found")
            sys.exit(1)
    
    def extract_model_fields(self, model_name):
        """Extract fields from a model definition"""
        model_pattern = re.compile(r'class\s+' + model_name + r'\(.*?\):.*?(?=class|\Z)', re.DOTALL)
        model_match = model_pattern.search(self.models_content)
        
        if not model_match:
            print(f"Could not find model {model_name} in models.py")
            return []
        
        model_content = model_match.group(0)
        
        # Find field declarations
        field_pattern = re.compile(r'^\s*(\w+)\s*=\s*models\.', re.MULTILINE)
        fields = field_pattern.findall(model_content)
        
        # Add common fields that might not be explicitly defined
        fields.extend(['id', 'created_at', 'updated_at'])
        
        # Remove duplicates
        fields = list(set(fields))
        
        return fields
    
    def extract_serializer_fields(self, serializer_name):
        """Extract fields from a serializer definition"""
        serializer_pattern = re.compile(r'class\s+' + serializer_name + r'\(.*?\):.*?(?=class|\Z)', re.DOTALL)
        serializer_match = serializer_pattern.search(self.schemas_content)
        
        if not serializer_match:
            print(f"Could not find serializer {serializer_name} in swagger_schemas.py")
            return []
        
        serializer_content = serializer_match.group(0)
        
        # Find fields in Meta.fields
        meta_fields_pattern = re.compile(r'fields\s*=\s*\(([^)]*)\)', re.DOTALL)
        meta_fields_match = meta_fields_pattern.search(serializer_content)
        
        if not meta_fields_match:
            return []
        
        fields_str = meta_fields_match.group(1)
        fields = [f.strip("' \n") for f in fields_str.split(',') if f.strip()]
        
        return fields
    
    def update_serializer(self, serializer_name, model_name):
        """Update a serializer to match the model fields"""
        model_fields = self.extract_model_fields(model_name)
        serializer_fields = self.extract_serializer_fields(serializer_name)
        
        if not model_fields:
            print(f"No fields found for model {model_name}")
            return False
        
        if not serializer_fields:
            print(f"No fields found for serializer {serializer_name}")
            return False
        
        # Find fields to add and remove
        fields_to_add = [f for f in model_fields if f not in serializer_fields]
        fields_to_remove = [f for f in serializer_fields if f not in model_fields]
        
        if not fields_to_add and not fields_to_remove:
            print(f"Serializer {serializer_name} is up-to-date with model {model_name}")
            return False
        
        print(f"Updating {serializer_name} to match {model_name}:")
        if fields_to_add:
            print(f"  - Adding fields: {', '.join(fields_to_add)}")
        if fields_to_remove:
            print(f"  - Removing fields: {', '.join(fields_to_remove)}")
        
        # Create new fields tuple
        new_fields = tuple(f for f in model_fields if f != '')
        new_fields_str = ', '.join([f"'{f}'" for f in new_fields])
        
        # Replace the fields tuple in the serializer
        serializer_pattern = re.compile(r'(class\s+' + serializer_name + r'.*?fields\s*=\s*\()([^)]*?)(\).*?(?=class|\Z))', re.DOTALL)
        new_schemas_content = serializer_pattern.sub(r'\1' + new_fields_str + r'\3', self.schemas_content)
        
        return new_schemas_content
    
    def update_all_serializers(self):
        """Update all serializers to match their corresponding models"""
        # Find all serializers in swagger_schemas.py
        serializer_pattern = re.compile(r'class\s+(\w+Serializer)\(.*?\):', re.DOTALL)
        serializers = serializer_pattern.findall(self.schemas_content)
        
        # Find all models in models.py
        model_pattern = re.compile(r'class\s+(\w+)\(.*?models\.Model.*?\):', re.DOTALL)
        models = model_pattern.findall(self.models_content)
        
        # Map serializers to models
        model_serializer_map = {}
        for serializer in serializers:
            model_name = serializer.replace('Serializer', '')
            if model_name in models:
                model_serializer_map[serializer] = model_name
        
        # Update each serializer
        updated_content = self.schemas_content
        for serializer, model in model_serializer_map.items():
            new_content = self.update_serializer(serializer, model)
            if new_content:
                updated_content = new_content
        
        # Check if anything changed
        if updated_content == self.schemas_content:
            print("No changes needed to swagger_schemas.py")
            return None
        
        # Create a backup of the original file
        schemas_file = os.path.join(self.api_dir, 'swagger_schemas.py')
        backup_file = os.path.join(self.api_dir, f'swagger_schemas.py.bak.{self.timestamp}')
        with open(backup_file, 'w') as f:
            f.write(self.schemas_content)
        print(f"Created backup of swagger_schemas.py at {backup_file}")
        
        # Save the updated file
        with open(schemas_file, 'w') as f:
            f.write(updated_content)
        print(f"Updated swagger_schemas.py")
        
        # Generate a diff
        diff = list(difflib.unified_diff(
            self.schemas_content.splitlines(),
            updated_content.splitlines(),
            fromfile='swagger_schemas.py (before)',
            tofile='swagger_schemas.py (after)',
            lineterm=''
        ))
        
        # Save the diff to a file
        diff_file = os.path.join(os.path.dirname(self.api_dir), 'APISSYNC', f'schema_diff_{self.timestamp}.diff')
        with open(diff_file, 'w') as f:
            f.write('\n'.join(diff))
        print(f"Diff saved to {diff_file}")
        
        return diff_file


if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixer = SchemaSerializer(project_root)
    fixer.update_all_serializers() 