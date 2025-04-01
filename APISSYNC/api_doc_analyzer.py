#!/usr/bin/env python
"""
API Documentation Analyzer

This script analyzes the API endpoints in a Django REST Framework project
and checks if they are properly documented using swagger_auto_schema.

Usage:
    python api_doc_analyzer.py

The script will generate a report in the APISSYNC directory.
"""

import os
import re
import json
import csv
from datetime import datetime
from collections import defaultdict


class APIDocAnalyzer:
    def __init__(self, project_root):
        self.project_root = project_root
        self.api_dir = os.path.join(project_root, 'backend', 'api')
        self.output_dir = os.path.join(project_root, 'APISSYNC')
        self.timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        
        # Statistics
        self.viewsets = []
        self.actions = []
        self.documented_actions = []
        self.undocumented_actions = []
        self.endpoints = []
        
    def find_viewsets(self):
        """Find all ViewSet classes in the project"""
        viewsets_pattern = re.compile(r'class\s+(\w+)\(.*ViewSet\):')
        
        views_file = os.path.join(self.api_dir, 'views.py')
        if os.path.exists(views_file):
            with open(views_file, 'r') as f:
                content = f.read()
                
            matches = viewsets_pattern.findall(content)
            self.viewsets = matches
            print(f"Found {len(self.viewsets)} ViewSets: {', '.join(self.viewsets)}")
        else:
            print(f"Error: {views_file} not found")
        
        return self.viewsets
        
    def find_actions(self):
        """Find all @action decorators in views.py"""
        action_pattern = re.compile(r'@action\s*\(.*?\)\s*def\s+(\w+)\s*\(', re.DOTALL)
        
        views_file = os.path.join(self.api_dir, 'views.py')
        if os.path.exists(views_file):
            with open(views_file, 'r') as f:
                content = f.read()
                
            matches = action_pattern.findall(content)
            self.actions = matches
            print(f"Found {len(self.actions)} custom actions")
        else:
            print(f"Error: {views_file} not found")
        
        return self.actions
        
    def find_documented_actions(self):
        """Find all actions with @swagger_auto_schema decorators"""
        swagger_pattern = re.compile(r'@swagger_auto_schema\s*\(.*?\)\s*@action.*?def\s+(\w+)\s*\(', re.DOTALL)
        
        views_file = os.path.join(self.api_dir, 'views.py')
        if os.path.exists(views_file):
            with open(views_file, 'r') as f:
                content = f.read()
                
            matches = swagger_pattern.findall(content)
            self.documented_actions = matches
            
            # Find undocumented actions
            self.undocumented_actions = [action for action in self.actions if action not in self.documented_actions]
            
            print(f"Found {len(self.documented_actions)} documented actions")
            print(f"Found {len(self.undocumented_actions)} undocumented actions")
        else:
            print(f"Error: {views_file} not found")
        
        return self.documented_actions
        
    def extract_endpoints_from_urls(self):
        """Extract API endpoints from urls.py"""
        urls_file = os.path.join(self.api_dir, 'urls.py')
        if os.path.exists(urls_file):
            with open(urls_file, 'r') as f:
                content = f.read()
                
            # Look for router.register calls
            register_pattern = re.compile(r'router\.register\(r\'([\w-]+)\',\s*(\w+)')
            registers = register_pattern.findall(content)
            
            # Extract base endpoints from router.register calls
            for url_pattern, viewset in registers:
                # Standard DRF endpoints for ModelViewSet
                self.endpoints.append({
                    'method': 'GET',
                    'url': f'/api/{url_pattern}/',
                    'viewset': viewset,
                    'action': 'list',
                    'documented': False  # Will be updated later
                })
                self.endpoints.append({
                    'method': 'POST',
                    'url': f'/api/{url_pattern}/',
                    'viewset': viewset,
                    'action': 'create',
                    'documented': False
                })
                self.endpoints.append({
                    'method': 'GET',
                    'url': f'/api/{url_pattern}/{{id}}/',
                    'viewset': viewset,
                    'action': 'retrieve',
                    'documented': False
                })
                self.endpoints.append({
                    'method': 'PUT',
                    'url': f'/api/{url_pattern}/{{id}}/',
                    'viewset': viewset,
                    'action': 'update',
                    'documented': False
                })
                self.endpoints.append({
                    'method': 'PATCH',
                    'url': f'/api/{url_pattern}/{{id}}/',
                    'viewset': viewset,
                    'action': 'partial_update',
                    'documented': False
                })
                self.endpoints.append({
                    'method': 'DELETE',
                    'url': f'/api/{url_pattern}/{{id}}/',
                    'viewset': viewset,
                    'action': 'destroy',
                    'documented': False
                })
                
                # Add custom actions
                for action in self.actions:
                    # Check if action is detail or list
                    is_detail = self._is_detail_action(action)
                    if is_detail:
                        self.endpoints.append({
                            'method': self._get_action_method(action),
                            'url': f'/api/{url_pattern}/{{id}}/{action.replace("_", "-")}/',
                            'viewset': viewset,
                            'action': action,
                            'documented': action in self.documented_actions
                        })
                    else:
                        self.endpoints.append({
                            'method': self._get_action_method(action),
                            'url': f'/api/{url_pattern}/{action.replace("_", "-")}/',
                            'viewset': viewset,
                            'action': action,
                            'documented': action in self.documented_actions
                        })
            
            print(f"Extracted {len(self.endpoints)} endpoints")
        else:
            print(f"Error: {urls_file} not found")
            
        return self.endpoints
    
    def _is_detail_action(self, action_name):
        """Determine if an action is detail=True or detail=False based on context clues"""
        views_file = os.path.join(self.api_dir, 'views.py')
        with open(views_file, 'r') as f:
            content = f.read()
        
        # Look for the action definition
        pattern = re.compile(r'@action\s*\(\s*detail\s*=\s*(\w+)', re.DOTALL)
        
        # Find all detail values
        detail_values = pattern.findall(content)
        
        # Simplified heuristic - usually methods like 'get_xyz' are detail=True
        if action_name.startswith('get_') or action_name.startswith('set_'):
            return True
        
        # For actions like 'me', 'profile', etc.
        common_detail_actions = ['me', 'profile', 'stats', 'download', 'upload', 'refund']
        if action_name in common_detail_actions:
            return True
            
        # For actions like 'list_xyz', 'all_xyz', etc.
        if 'list' in action_name or 'all' in action_name:
            return False
        
        # Default to detail=False
        return False
    
    def _get_action_method(self, action_name):
        """Guess the HTTP method based on action name"""
        if action_name.startswith('get_') or action_name in ['me', 'profile', 'statistics']:
            return 'GET'
        if action_name.startswith('create_') or action_name in ['register', 'signup']:
            return 'POST'
        if action_name.startswith('update_'):
            return 'PUT'
        if action_name.startswith('delete_'):
            return 'DELETE'
        if action_name in ['refund', 'process', 'approve', 'reject']:
            return 'POST'
        
        # Default to GET
        return 'GET'
    
    def generate_report(self):
        """Generate reports about API documentation coverage"""
        # Create JSON report
        json_report = {
            'timestamp': self.timestamp,
            'viewsets': self.viewsets,
            'actions': self.actions,
            'documented_actions': self.documented_actions,
            'undocumented_actions': self.undocumented_actions,
            'documentation_coverage': {
                'actions': f"{len(self.documented_actions)}/{len(self.actions)} ({len(self.documented_actions)/len(self.actions)*100:.1f}%)" if self.actions else "N/A",
            },
            'endpoints': self.endpoints
        }
        
        json_file = os.path.join(self.output_dir, f'api_doc_report_{self.timestamp}.json')
        with open(json_file, 'w') as f:
            json.dump(json_report, f, indent=2)
        print(f"JSON report saved to {json_file}")
        
        # Create CSV report for endpoints
        csv_file = os.path.join(self.output_dir, f'endpoints_{self.timestamp}.csv')
        with open(csv_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Method', 'URL', 'ViewSet', 'Action', 'Documented'])
            for endpoint in self.endpoints:
                writer.writerow([
                    endpoint['method'],
                    endpoint['url'],
                    endpoint['viewset'],
                    endpoint['action'],
                    'Yes' if endpoint['documented'] else 'No'
                ])
        print(f"CSV report saved to {csv_file}")
        
        # Create markdown documentation checklist
        md_file = os.path.join(self.output_dir, f'documentation_checklist_{self.timestamp}.md')
        with open(md_file, 'w') as f:
            f.write(f"# API Documentation Checklist\n\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write(f"## Documentation Coverage\n\n")
            f.write(f"- Total ViewSets: {len(self.viewsets)}\n")
            f.write(f"- Total Actions: {len(self.actions)}\n")
            f.write(f"- Documented Actions: {len(self.documented_actions)}\n")
            if self.actions:
                f.write(f"- Documentation Coverage: {len(self.documented_actions)/len(self.actions)*100:.1f}%\n\n")
            
            f.write(f"## Undocumented Actions\n\n")
            if self.undocumented_actions:
                f.write("The following actions need documentation:\n\n")
                for action in self.undocumented_actions:
                    f.write(f"- [ ] `{action}`\n")
            else:
                f.write("All actions are documented! 🎉\n")
            
            f.write(f"\n## API Endpoints\n\n")
            
            # Group endpoints by viewset
            endpoints_by_viewset = defaultdict(list)
            for endpoint in self.endpoints:
                endpoints_by_viewset[endpoint['viewset']].append(endpoint)
            
            for viewset, endpoints in endpoints_by_viewset.items():
                f.write(f"### {viewset}\n\n")
                f.write("| Method | URL | Action | Documented |\n")
                f.write("|--------|-----|--------|------------|\n")
                
                for endpoint in endpoints:
                    documented = "✅" if endpoint['documented'] else "❌"
                    f.write(f"| {endpoint['method']} | `{endpoint['url']}` | `{endpoint['action']}` | {documented} |\n")
                
                f.write("\n")
            
            f.write(f"\n## Documentation Template\n\n")
            f.write("For undocumented actions, use this template:\n\n")
            f.write("```python\n")
            f.write("@swagger_auto_schema(\n")
            f.write("    operation_summary=\"Short description here\",\n")
            f.write("    operation_description=\"Detailed description here\",\n")
            f.write("    request_body=YourRequestSerializer,  # If applicable\n")
            f.write("    responses={\n")
            f.write("        200: YourResponseSerializer,\n")
            f.write("        400: \"Bad request description\",\n")
            f.write("        404: \"Not found description\"\n")
            f.write("    }\n")
            f.write(")\n")
            f.write("@action(detail=True, methods=['post'])  # Your existing action decorator\n")
            f.write("def your_action(self, request, pk=None):\n")
            f.write("    ...\n")
            f.write("```\n")
        
        print(f"Markdown checklist saved to {md_file}")
        
        return json_file, csv_file, md_file
    
    def run(self):
        """Run the full analysis"""
        print(f"Analyzing API documentation in {self.project_root}...")
        self.find_viewsets()
        self.find_actions()
        self.find_documented_actions()
        self.extract_endpoints_from_urls()
        return self.generate_report()


if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    analyzer = APIDocAnalyzer(project_root)
    analyzer.run() 