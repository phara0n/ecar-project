#!/usr/bin/env python3
"""
API Documentation Improver

This script helps to improve API documentation by suggesting documentation templates
for undocumented endpoints in a Django REST Framework project.

Usage:
    python3 api_doc_improver.py [viewset_name] [action_name]

Examples:
    python3 api_doc_improver.py                 # Generate suggestions for all undocumented endpoints
    python3 api_doc_improver.py InvoiceViewSet  # Generate suggestions for InvoiceViewSet only
    python3 api_doc_improver.py InvoiceViewSet refund  # Generate suggestion for the refund action only
"""

import os
import re
import sys
import json
from datetime import datetime
from collections import defaultdict


class APIDocImprover:
    def __init__(self, project_root):
        self.project_root = project_root
        self.api_dir = os.path.join(project_root, 'backend', 'api')
        self.output_dir = os.path.join(project_root, 'APISSYNC')
        self.timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        # Find the most recent report
        reports = [f for f in os.listdir(self.output_dir) if f.startswith('api_doc_report_') and f.endswith('.json')]
        if reports:
            self.report_file = os.path.join(self.output_dir, sorted(reports)[-1])
            with open(self.report_file, 'r') as f:
                self.report = json.load(f)
        else:
            print("No report file found. Run api_doc_analyzer.py first.")
            sys.exit(1)
        
        # Load views.py content
        views_file = os.path.join(self.api_dir, 'views.py')
        if os.path.exists(views_file):
            with open(views_file, 'r') as f:
                self.views_content = f.read()
        else:
            print(f"Error: {views_file} not found")
            sys.exit(1)
    
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
        action_pattern = re.compile(r'@action.*?\s+def\s+' + action_name + r'\s*\(.*?(?=@action|\s+def\s+|\Z)', re.DOTALL)
        action_match = action_pattern.search(class_content)
        
        if not action_match:
            print(f"Could not find action {action_name} in {viewset_name}")
            return None
        
        return action_match.group(0)
    
    def generate_suggestion(self, viewset_name, action_name):
        """Generate a suggestion for documenting an action"""
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
        if 'list' in action_name or 'all' in action_name or 'get' in action_name:
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
        
        # Generate the swagger_auto_schema decorator
        suggestion = "@swagger_auto_schema(\n"
        suggestion += f"    operation_summary=\"{operation_summary}\",\n"
        suggestion += f"    operation_description=\"{operation_description}\",\n"
        
        # Add tags based on viewset name
        tags = viewset_name.lower().replace('viewset', '')
        suggestion += f"    tags=['{tags}'],\n"
        
        # Add request body if applicable
        if request_body and 'post' in [m.lower() for m in methods]:
            suggestion += f"    request_body={request_body},\n"
        
        # Add responses
        suggestion += "    responses={\n"
        if 'get' in [m.lower() for m in methods]:
            suggestion += f"        200: {response_serializer or 'openapi.Response(\"Success\")'},\n"
        elif 'post' in [m.lower() for m in methods]:
            suggestion += f"        201: {response_serializer or 'openapi.Response(\"Created\")'},\n"
        elif 'delete' in [m.lower() for m in methods]:
            suggestion += "        204: openapi.Response(\"No content\"),\n"
        else:
            suggestion += f"        200: {response_serializer or 'openapi.Response(\"Success\")'},\n"
        
        suggestion += "        400: \"Bad request\",\n"
        suggestion += "        401: \"Unauthorized\",\n"
        if is_detail:
            suggestion += "        404: \"Not found\"\n"
        suggestion += "    }\n"
        suggestion += ")\n"
        
        return suggestion
    
    def improve_all(self, target_viewset=None, target_action=None):
        """Generate suggestions for all undocumented actions or specific ones"""
        # Get the list of undocumented actions
        undocumented = self.report['undocumented_actions']
        
        # Prepare to group by viewset
        viewset_actions = defaultdict(list)
        
        # Find which viewset each action belongs to
        for action in undocumented:
            if target_action and action != target_action:
                continue
                
            for endpoint in self.report['endpoints']:
                if endpoint['action'] == action:
                    viewset = endpoint['viewset']
                    if target_viewset and viewset != target_viewset:
                        continue
                    if (viewset, action) not in viewset_actions.items():
                        viewset_actions[viewset].append(action)
                    break
        
        # Generate suggestions for each action grouped by viewset
        suggestions = {}
        for viewset, actions in viewset_actions.items():
            suggestions[viewset] = {}
            for action in actions:
                suggestion = self.generate_suggestion(viewset, action)
                if suggestion:
                    suggestions[viewset][action] = suggestion
        
        return suggestions
    
    def print_suggestions(self, suggestions):
        """Print the suggestions in a readable format"""
        print("\n" + "=" * 80)
        print("API DOCUMENTATION IMPROVEMENT SUGGESTIONS")
        print("=" * 80)
        
        for viewset, actions in suggestions.items():
            print(f"\n\n## {viewset}\n")
            
            for action, suggestion in actions.items():
                print(f"\n### Action: `{action}`\n")
                print("Add this decorator before the `@action` decorator:\n")
                print("```python")
                print(suggestion)
                print("```")
        
        print("\n\n" + "=" * 80)
        print("END OF SUGGESTIONS")
        print("=" * 80)
    
    def save_suggestions(self, suggestions):
        """Save the suggestions to a file"""
        output_file = os.path.join(self.output_dir, f"documentation_suggestions_{self.timestamp}.md")
        
        with open(output_file, 'w') as f:
            f.write("# API Documentation Improvement Suggestions\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            for viewset, actions in suggestions.items():
                f.write(f"## {viewset}\n\n")
                
                for action, suggestion in actions.items():
                    f.write(f"### Action: `{action}`\n\n")
                    f.write("Add this decorator before the `@action` decorator:\n\n")
                    f.write("```python\n")
                    f.write(suggestion)
                    f.write("```\n\n")
            
            f.write("\n\n---\n\n")
            f.write("To apply these suggestions, edit `backend/api/views.py` and add the swagger_auto_schema decorators before the corresponding @action decorators.\n")
        
        print(f"Suggestions saved to {output_file}")
        return output_file
    
    def run(self, target_viewset=None, target_action=None):
        """Run the improvement process"""
        print(f"Generating documentation suggestions for undocumented API endpoints...")
        if target_viewset:
            print(f"Filtering for ViewSet: {target_viewset}")
        if target_action:
            print(f"Filtering for action: {target_action}")
            
        suggestions = self.improve_all(target_viewset, target_action)
        self.print_suggestions(suggestions)
        output_file = self.save_suggestions(suggestions)
        
        return output_file


if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    target_viewset = None
    target_action = None
    
    if len(sys.argv) > 1:
        target_viewset = sys.argv[1]
    
    if len(sys.argv) > 2:
        target_action = sys.argv[2]
    
    improver = APIDocImprover(project_root)
    improver.run(target_viewset, target_action) 