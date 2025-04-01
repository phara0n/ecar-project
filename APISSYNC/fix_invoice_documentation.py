#!/usr/bin/env python3
"""
Simplified script to add Swagger documentation to specific invoice actions.
This script takes extra care to maintain proper indentation.
"""

import os
import re

def fix_invoice_documentation():
    # Paths inside the Docker container
    views_file = '/app/api/views.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{views_file}.new.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    # Find the InvoiceViewSet class
    invoice_viewset_pattern = re.compile(r'class\s+InvoiceViewSet\(.*?\):.*?(?=class|\Z)', re.DOTALL)
    match = invoice_viewset_pattern.search(content)
    
    if not match:
        print("Could not find InvoiceViewSet in views.py")
        return
    
    viewset_content = match.group(0)
    viewset_start = match.start()
    viewset_end = match.end()
    
    # Find all @action decorators in the class that don't have @swagger_auto_schema
    undecorated_actions = []
    action_pattern = re.compile(r'(\s+)@action.*?detail=(\w+).*?def\s+(\w+)\s*\(', re.DOTALL)
    swagger_pattern = re.compile(r'@swagger_auto_schema\s*\(.*?\)\s*@action.*?def\s+(\w+)\s*\(', re.DOTALL)
    
    # Find all actions with swagger docs
    documented_actions = []
    for swagger_match in swagger_pattern.finditer(viewset_content):
        documented_actions.append(swagger_match.group(1))
    
    # Find all actions without swagger docs
    for action_match in action_pattern.finditer(viewset_content):
        indent = action_match.group(1)  # Get the indentation level
        is_detail = action_match.group(2) == 'True'
        action_name = action_match.group(3)
        
        if action_name not in documented_actions:
            undecorated_actions.append((action_name, indent, is_detail))
    
    if not undecorated_actions:
        print("All actions already have swagger documentation.")
        return
    
    # Create documentation for each undocumented action
    updated_content = content
    for action_name, indent, is_detail in undecorated_actions:
        # Prepare the documentation with proper indentation
        if action_name == 'paid':
            doc = f"{indent}@swagger_auto_schema(\n"
            doc += f"{indent}    operation_summary=\"Get paid invoices\",\n"
            doc += f"{indent}    operation_description=\"Returns a list of all paid invoices\",\n"
            doc += f"{indent}    tags=[\"invoices\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: InvoiceSerializer(many=True)\n"
            doc += f"{indent}    }}\n"
            doc += f"{indent})\n"
        elif action_name == 'unpaid':
            doc = f"{indent}@swagger_auto_schema(\n"
            doc += f"{indent}    operation_summary=\"Get unpaid invoices\",\n"
            doc += f"{indent}    operation_description=\"Returns a list of all unpaid (pending) invoices\",\n"
            doc += f"{indent}    tags=[\"invoices\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: InvoiceSerializer(many=True)\n"
            doc += f"{indent}    }}\n"
            doc += f"{indent})\n"
        elif action_name == 'refunded':
            doc = f"{indent}@swagger_auto_schema(\n"
            doc += f"{indent}    operation_summary=\"Get refunded invoices\",\n"
            doc += f"{indent}    operation_description=\"Returns a list of all refunded invoices\",\n"
            doc += f"{indent}    tags=[\"invoices\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: InvoiceSerializer(many=True)\n"
            doc += f"{indent}    }}\n"
            doc += f"{indent})\n"
        elif action_name == 'statistics':
            doc = f"{indent}@swagger_auto_schema(\n"
            doc += f"{indent}    operation_summary=\"Get invoice statistics\",\n"
            doc += f"{indent}    operation_description=\"Returns statistics about invoices including counts by status and financial data\",\n"
            doc += f"{indent}    tags=[\"invoices\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Invoice statistics with counts and financial data\"\n"
            doc += f"{indent}    }}\n"
            doc += f"{indent})\n"
        elif action_name == 'mark_as_paid':
            doc = f"{indent}@swagger_auto_schema(\n"
            doc += f"{indent}    operation_summary=\"Mark invoice as paid\",\n"
            doc += f"{indent}    operation_description=\"Updates the status of an invoice to 'paid'\",\n"
            doc += f"{indent}    tags=[\"invoices\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: InvoiceSerializer,\n"
            doc += f"{indent}        400: \"Bad request\",\n"
            doc += f"{indent}        404: \"Invoice not found\"\n"
            doc += f"{indent}    }}\n"
            doc += f"{indent})\n"
        elif action_name == 'refund':
            doc = f"{indent}@swagger_auto_schema(\n"
            doc += f"{indent}    operation_summary=\"Process refund for invoice\",\n"
            doc += f"{indent}    operation_description=\"Refund a paid invoice and record refund details\",\n"
            doc += f"{indent}    tags=[\"invoices\"],\n"
            doc += f"{indent}    request_body=RefundRequestSerializer,\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: InvoiceSerializer,\n"
            doc += f"{indent}        400: \"Bad request - invoice cannot be refunded\",\n"
            doc += f"{indent}        404: \"Invoice not found\"\n"
            doc += f"{indent}    }}\n"
            doc += f"{indent})\n"
        else:
            # Skip unknown actions
            continue
        
        # Find the specific action to insert the documentation before
        action_regex = re.compile(f"{re.escape(indent)}@action.*?def\\s+{action_name}\\s*\\(", re.DOTALL)
        action_match = action_regex.search(updated_content)
        
        if not action_match:
            print(f"Could not find action '{action_name}' in InvoiceViewSet.")
            continue
        
        # Insert the documentation
        start_pos = action_match.start()
        updated_content = updated_content[:start_pos] + doc + updated_content[start_pos:]
        print(f"✅ Added documentation to action '{action_name}'")
    
    # Save the updated file
    with open(views_file, 'w') as f:
        f.write(updated_content)
    
    print(f"✅ Successfully updated API documentation.")

if __name__ == "__main__":
    fix_invoice_documentation() 