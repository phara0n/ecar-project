#!/usr/bin/env python3
"""
Script to identify API endpoints that are missing Swagger documentation
"""
import re
import os

views_path = "/home/ecar/ecar_project/backend/api/views.py"

# This will keep track of our findings
undocumented = {
    'functions': [],
    'methods': [],
    'actions': []
}

with open(views_path, 'r') as file:
    content = file.read()

# Look for functions with decorators
function_pattern = r'(.*?)def (\w+)\(([^)]*)\):'
function_matches = re.finditer(function_pattern, content, re.DOTALL)

for match in function_matches:
    decorators = match.group(1)
    function_name = match.group(2)
    
    # Skip if it's not an API endpoint
    if '@api_view' not in decorators:
        continue
    
    # Skip if it already has Swagger documentation
    if '@swagger_auto_schema' in decorators:
        continue
        
    # Skip some common utility functions
    if function_name in ['ratelimited_error', 'custom_logout']:
        continue
        
    # Otherwise, add to undocumented list
    undocumented['functions'].append(function_name)

# Look for viewset methods without swagger_auto_schema
viewset_pattern = r'class (\w+)ViewSet\(.*?:.*?(?=class|\Z)'
viewset_matches = re.finditer(viewset_pattern, content, re.DOTALL)

standard_methods = ['list', 'create', 'retrieve', 'update', 'partial_update', 'destroy']

for viewset_match in viewset_matches:
    viewset_name = viewset_match.group(1)
    viewset_content = viewset_match.group(0)
    
    # Extract all method definitions
    method_pattern = r'def (\w+)\(self, request.*?\):'
    method_matches = re.finditer(method_pattern, viewset_content)
    
    for method_match in method_matches:
        method_name = method_match.group(1)
        
        # Skip if not a standard DRF method
        if method_name not in standard_methods:
            continue
            
        # Find the method's position
        method_pos = viewset_content.find(f'def {method_name}(')
        if method_pos == -1:
            continue
            
        # Get content before the method (to look for swagger_auto_schema)
        method_context = viewset_content[max(0, method_pos-500):method_pos]
        
        # If no swagger_auto_schema decorator, it's undocumented
        if '@swagger_auto_schema' not in method_context:
            undocumented['methods'].append(f"{viewset_name}ViewSet.{method_name}")
    
    # Find all action decorators
    action_pattern = r'@action\(.*?\)\s*(.*?)def (\w+)\('
    action_matches = re.finditer(action_pattern, viewset_content, re.DOTALL)
    
    for action_match in action_matches:
        between_decorators = action_match.group(1)
        action_name = action_match.group(2)
        
        # If no swagger_auto_schema between @action and def, it's undocumented
        if '@swagger_auto_schema' not in between_decorators:
            undocumented['actions'].append(f"{viewset_name}ViewSet.{action_name}")

# Print results
print("Undocumented API endpoints:\n")

if undocumented['functions']:
    print("Functions with @api_view but no @swagger_auto_schema:")
    for func in sorted(undocumented['functions']):
        print(f"  - {func}")
    print()

if undocumented['methods']:
    print("ViewSet methods without @swagger_auto_schema:")
    for method in sorted(undocumented['methods']):
        print(f"  - {method}")
    print()

if undocumented['actions']:
    print("ViewSet actions without @swagger_auto_schema:")
    for action in sorted(undocumented['actions']):
        print(f"  - {action}")
    print()

if not any(undocumented.values()):
    print("All API endpoints appear to have Swagger documentation!") 