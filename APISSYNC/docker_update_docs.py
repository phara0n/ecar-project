"""
Docker API Documentation Update Script

This script is designed to run inside the Docker container to:
1. Identify undocumented API endpoints
2. Generate appropriate Swagger documentation
3. Apply the documentation to the codebase

Usage (from project root):
    docker-compose exec backend python /app/APISSYNC/docker_update_docs.py
"""

import os
import re
import sys
from collections import defaultdict

# Make sure Django is configured
# Find the actual settings module
for module_name in ['ecar_backend.settings', 'backend.settings', 'settings']:
    try:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", module_name)
        break
    except ImportError:
        continue

import django
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    print("Running without Django configuration...")

# Try to import DRF and drf-yasg directly
try:
    from rest_framework import viewsets
    from drf_yasg import openapi
    from drf_yasg.utils import swagger_auto_schema
    from rest_framework.decorators import action
except ImportError as e:
    print(f"Error importing required modules: {e}")
    print("This script needs to be run in a Django environment with DRF and drf-yasg.")
    sys.exit(1)

class DocUpdater:
    def __init__(self):
        # Paths inside the Docker container
        self.api_dir = '/app/api'
        self.views_file = os.path.join(self.api_dir, 'views.py')
        self.total_actions = 0
        self.updated_actions = 0
        
        # Load views.py content
        if os.path.exists(self.views_file):
            with open(self.views_file, 'r') as f:
                self.views_content = f.read()
        else:
            print(f"Error: {self.views_file} not found")
            sys.exit(1)
    
    def find_viewsets(self):
        """Find all ViewSet classes in the project"""
        viewsets_pattern = re.compile(r'class\s+(\w+)\(.*ViewSet\):')
        matches = viewsets_pattern.findall(self.views_content)
        print(f"Found {len(matches)} ViewSets: {', '.join(matches)}")
        return matches
    
    def find_actions(self):
        """Find all custom @action methods in viewsets"""
        action_pattern = re.compile(r'@action\s*\(.*?\)\s*def\s+(\w+)\s*\(', re.DOTALL)
        matches = action_pattern.findall(self.views_content)
        self.total_actions = len(matches)
        print(f"Found {self.total_actions} custom actions")
        return matches
    
    def find_documented_actions(self):
        """Find actions that already have @swagger_auto_schema decorators"""
        swagger_pattern = re.compile(r'@swagger_auto_schema\s*\(.*?\)\s*@action.*?def\s+(\w+)\s*\(', re.DOTALL)
        matches = swagger_pattern.findall(self.views_content)
        print(f"Found {len(matches)} documented actions")
        return matches
    
    def find_undocumented_actions(self):
        """Find actions that don't have @swagger_auto_schema decorators"""
        all_actions = self.find_actions()
        documented_actions = self.find_documented_actions()
        undocumented = [action for action in all_actions if action not in documented_actions]
        print(f"Found {len(undocumented)} undocumented actions")
        return undocumented
    
    def find_action_in_viewset(self, action_name):
        """Find which viewset contains a specific action"""
        viewsets = self.find_viewsets()
        
        for viewset in viewsets:
            # Check if action exists in this viewset
            pattern = re.compile(r'class\s+' + viewset + r'\(.*?\):.*?def\s+' + action_name + r'\s*\(', re.DOTALL)
            if pattern.search(self.views_content):
                return viewset
        
        return None
    
    def find_action_definition(self, viewset_name, action_name):
        """Find the actual definition of an action in views.py"""
        # Look for the class definition
        class_pattern = re.compile(r'class\s+' + viewset_name + r'\(.*?\):.*?(?=class|\Z)', re.DOTALL)
        class_match = class_pattern.search(self.views_content)
        
        if not class_match:
            print(f"Could not find class {viewset_name} in views.py")
            return None
        
        class_content = class_match.group(0)
        
        # Look for the action definition
        action_pattern = re.compile(r'(@action.*?\s+def\s+' + action_name + r'\s*\(.*?)(?=@action|\s+def\s+|\Z)', re.DOTALL)
        action_match = action_pattern.search(class_content)
        
        if not action_match:
            print(f"Could not find action {action_name} in {viewset_name}")
            return None
        
        return action_match.group(0)
    
    def generate_documentation(self, viewset_name, action_name):
        """Generate a swagger_auto_schema decorator for an action"""
        action_def = self.find_action_definition(viewset_name, action_name)
        
        if not action_def:
            return None
        
        # Determine if it's a detail action
        detail_match = re.search(r'@action\s*\(\s*detail\s*=\s*(\w+)', action_def)
        is_detail = detail_match and detail_match.group(1) == 'True'
        
        # Determine HTTP methods
        methods_match = re.search(r'methods=\[([^\]]+)\]', action_def)
        methods = []
        if methods_match:
            methods_str = methods_match.group(1)
            methods = [m.strip("'\"") for m in methods_str.split(',')]
        else:
            methods = ['get']  # Default method
        
        # Determine the function docstring if any
        docstring_match = re.search(r'def\s+' + action_name + r'\s*\([^)]*\):(?:\s*"""(.*?)""")?', action_def, re.DOTALL)
        docstring = ''
        if docstring_match and docstring_match.group(1):
            docstring = docstring_match.group(1).strip()
        
        # Generate operation summary and description
        operation_summary = f"{action_name.replace('_', ' ').title()}"
        if docstring:
            operation_description = docstring
        else:
            operation_description = f"Perform the {action_name.replace('_', ' ')} operation"
        
        # Determine likely request/response serializers
        request_body = None
        response_serializer = None
        
        # Common patterns based on action name
        if 'list' in action_name or 'all' in action_name or action_name in ['get', 'statistics']:
            response_serializer = f"{viewset_name.replace('ViewSet', '')}Serializer(many=True)"
        elif 'detail' in action_name or 'info' in action_name or action_name in ['me', 'profile']:
            response_serializer = f"{viewset_name.replace('ViewSet', '')}Serializer()"
        elif 'create' in action_name or 'add' in action_name:
            request_body = f"{viewset_name.replace('ViewSet', '')}Serializer"
            response_serializer = f"{viewset_name.replace('ViewSet', '')}Serializer()"
        elif 'update' in action_name:
            request_body = f"{viewset_name.replace('ViewSet', '')}Serializer"
            response_serializer = f"{viewset_name.replace('ViewSet', '')}Serializer()"
        elif action_name in ['mark_as_paid', 'refund', 'cancel', 'complete']:
            # Special cases for common actions
            if action_name == 'refund':
                request_body = "RefundRequestSerializer"
                operation_summary = "Process refund"
                operation_description = "Refund a paid invoice and record refund details"
            elif action_name == 'mark_as_paid':
                operation_summary = "Mark as paid"
                operation_description = "Mark an invoice as paid"
            elif action_name == 'cancel':
                operation_summary = "Cancel service"
                operation_description = "Cancel a scheduled service"
            elif action_name == 'complete':
                operation_summary = "Complete service"
                operation_description = "Mark a service as completed"
        
        # Special handling for common operations
        if viewset_name == 'InvoiceViewSet':
            if action_name == 'paid':
                operation_summary = "Get paid invoices"
                operation_description = "Returns a list of all paid invoices"
            elif action_name == 'unpaid':
                operation_summary = "Get unpaid invoices"
                operation_description = "Returns a list of all unpaid invoices (status = pending)"
            elif action_name == 'refunded':
                operation_summary = "Get refunded invoices" 
                operation_description = "Returns a list of all refunded invoices"
        
        # Generate the swagger_auto_schema decorator
        doc = "@swagger_auto_schema(\n"
        doc += f"    operation_summary=\"{operation_summary}\",\n"
        doc += f"    operation_description=\"{operation_description}\",\n"
        
        # Add tags based on viewset name
        tags = viewset_name.lower().replace('viewset', '')
        doc += f"    tags=['{tags}'],\n"
        
        # Add request body if applicable
        if request_body and any(m.lower() in ['post', 'put', 'patch'] for m in methods):
            doc += f"    request_body={request_body},\n"
        
        # Add responses
        doc += "    responses={\n"
        if any(m.lower() == 'get' for m in methods):
            doc += f"        200: {response_serializer or 'openapi.Response(\"Success\")'},\n"
        elif any(m.lower() == 'post' for m in methods):
            doc += f"        201: {response_serializer or 'openapi.Response(\"Created\")'},\n"
        elif any(m.lower() == 'delete' for m in methods):
            doc += "        204: openapi.Response(\"No content\"),\n"
        else:
            doc += f"        200: {response_serializer or 'openapi.Response(\"Success\")'},\n"
        
        doc += "        400: \"Bad request\",\n"
        doc += "        401: \"Unauthorized\",\n"
        if is_detail:
            doc += "        404: \"Not found\"\n"
        doc += "    }\n"
        doc += ")"
        
        return doc
    
    def apply_documentation(self, viewset_name, action_name, documentation):
        """Apply the documentation to the action in views.py"""
        pattern = re.compile(r'(class\s+' + viewset_name + r'\(.*?)(@action\s*\(.*?\)\s*def\s+' + action_name + r'\s*\()', re.DOTALL)
        
        if not pattern.search(self.views_content):
            print(f"Could not find the action {action_name} in viewset {viewset_name} to apply documentation")
            return False
        
        # Replace with documentation added
        updated_content = pattern.sub(r'\1' + documentation + r'\n\2', self.views_content)
        
        # Check if the content was actually changed
        if updated_content == self.views_content:
            print(f"Failed to update documentation for {action_name} in {viewset_name}")
            return False
        
        # Update the content
        self.views_content = updated_content
        self.updated_actions += 1
        print(f"✅ Added documentation for {viewset_name}.{action_name}")
        return True
    
    def save_changes(self):
        """Save the updated views.py file"""
        # Create a backup first
        import time
        backup_file = f"{self.views_file}.bak.{int(time.time())}"
        with open(backup_file, 'w') as f:
            with open(self.views_file, 'r') as original:
                f.write(original.read())
        print(f"Created backup at {backup_file}")
        
        # Save the updated file
        with open(self.views_file, 'w') as f:
            f.write(self.views_content)
        
        print(f"\n✅ Successfully updated {self.updated_actions} of {self.total_actions} actions")
        print(f"Changes have been saved to {self.views_file}")
    
    def run(self):
        """Main execution flow"""
        print("🔍 Analyzing API endpoints for documentation...")
        
        undocumented_actions = self.find_undocumented_actions()
        if not undocumented_actions:
            print("✅ All actions are already documented!")
            return
        
        # Group actions by viewset
        actions_by_viewset = defaultdict(list)
        for action in undocumented_actions:
            viewset = self.find_action_in_viewset(action)
            if viewset:
                actions_by_viewset[viewset].append(action)
        
        # Generate and apply documentation for each action
        print("\n🔧 Generating and applying documentation...")
        for viewset, actions in actions_by_viewset.items():
            print(f"\nProcessing viewset: {viewset}")
            for action in actions:
                documentation = self.generate_documentation(viewset, action)
                if documentation:
                    self.apply_documentation(viewset, action, documentation)
        
        # Save changes
        if self.updated_actions > 0:
            self.save_changes()
            print("\n🎉 Swagger documentation has been updated for all undocumented endpoints!")
        else:
            print("\n❌ No changes were made to the documentation")


if __name__ == "__main__":
    updater = DocUpdater()
    updater.run() 