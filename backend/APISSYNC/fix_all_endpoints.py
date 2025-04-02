#!/usr/bin/env python3
"""
Comprehensive script to add Swagger documentation to all API endpoints.
This script can handle various ViewSets and actions throughout the codebase.
"""

import os
import re

def fix_all_endpoints():
    # Paths inside the Docker container
    views_file = '/app/api/views.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{views_file}.comprehensive.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    # Find all ViewSet classes
    viewset_pattern = re.compile(r'class\s+(\w+ViewSet)\s*\((.*?)\):.*?(?=class|\Z)', re.DOTALL)
    viewset_matches = viewset_pattern.finditer(content)
    
    if not viewset_matches:
        print("Could not find any ViewSet classes in views.py")
        return
    
    # Process each ViewSet
    updated_content = content
    total_actions_updated = 0
    
    for viewset_match in viewset_pattern.finditer(content):
        viewset_name = viewset_match.group(1)
        viewset_content = viewset_match.group(0)
        
        print(f"\nAnalyzing {viewset_name}...")
        
        # Extract the model name from the ViewSet name
        model_name = viewset_name.replace('ViewSet', '')
        
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
            print(f"  All actions in {viewset_name} already have swagger documentation.")
            continue
        
        # Create documentation for each undocumented action
        actions_updated = 0
        for action_name, indent, is_detail in undecorated_actions:
            # Determine the serializer name based on the model name
            serializer_name = f"{model_name}Serializer"
            
            # Prepare the documentation with proper indentation
            doc = create_documentation(action_name, indent, is_detail, serializer_name, model_name)
            
            if not doc:
                print(f"  Skipping unknown action: {action_name}")
                continue
            
            # Find the specific action to insert the documentation before
            action_regex = re.compile(f"{re.escape(indent)}@action.*?def\\s+{action_name}\\s*\\(", re.DOTALL)
            action_match = action_regex.search(updated_content)
            
            if not action_match:
                print(f"  Could not find action '{action_name}' in {viewset_name}.")
                continue
            
            # Insert the documentation
            start_pos = action_match.start()
            updated_content = updated_content[:start_pos] + doc + updated_content[start_pos:]
            actions_updated += 1
            total_actions_updated += 1
            print(f"  ✅ Added documentation to action '{action_name}'")
        
        print(f"  Updated {actions_updated} actions in {viewset_name}")
    
    # Save the updated file
    if total_actions_updated > 0:
        with open(views_file, 'w') as f:
            f.write(updated_content)
        print(f"\n✅ Successfully updated documentation for {total_actions_updated} actions across all ViewSets.")
    else:
        print("\nNo changes were made - all actions already have documentation.")

def create_documentation(action_name, indent, is_detail, serializer_name, model_name):
    """Generate appropriate Swagger documentation based on the action name."""
    doc = f"{indent}@swagger_auto_schema(\n"
    
    # Common actions
    if action_name in ['list', 'all', 'active', 'inactive']:
        doc += f"{indent}    operation_summary=\"Get {action_name} {model_name.lower()}s\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of {action_name} {model_name.lower()}s\",\n"
        doc += f"{indent}    tags=[\"{model_name.lower()}s\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: {serializer_name}(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif action_name in ['create', 'add']:
        doc += f"{indent}    operation_summary=\"Create {model_name.lower()}\",\n"
        doc += f"{indent}    operation_description=\"Creates a new {model_name.lower()}\",\n"
        doc += f"{indent}    tags=[\"{model_name.lower()}s\"],\n"
        doc += f"{indent}    request_body={serializer_name},\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        201: {serializer_name},\n"
        doc += f"{indent}        400: \"Bad request\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif action_name in ['update', 'edit']:
        doc += f"{indent}    operation_summary=\"Update {model_name.lower()}\",\n"
        doc += f"{indent}    operation_description=\"Updates an existing {model_name.lower()}\",\n"
        doc += f"{indent}    tags=[\"{model_name.lower()}s\"],\n"
        doc += f"{indent}    request_body={serializer_name},\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: {serializer_name},\n"
        doc += f"{indent}        400: \"Bad request\",\n"
        doc += f"{indent}        404: \"{model_name} not found\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif action_name in ['delete', 'remove']:
        doc += f"{indent}    operation_summary=\"Delete {model_name.lower()}\",\n"
        doc += f"{indent}    operation_description=\"Deletes an existing {model_name.lower()}\",\n"
        doc += f"{indent}    tags=[\"{model_name.lower()}s\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        204: \"No content\",\n"
        doc += f"{indent}        404: \"{model_name} not found\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif action_name == 'statistics':
        doc += f"{indent}    operation_summary=\"Get {model_name.lower()} statistics\",\n"
        doc += f"{indent}    operation_description=\"Returns statistics about {model_name.lower()}s\",\n"
        doc += f"{indent}    tags=[\"{model_name.lower()}s\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Statistics data\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    
    # Invoice-specific actions
    elif model_name == 'Invoice' and action_name == 'paid':
        doc += f"{indent}    operation_summary=\"Get paid invoices\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of all paid invoices\",\n"
        doc += f"{indent}    tags=[\"invoices\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: InvoiceSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Invoice' and action_name == 'unpaid':
        doc += f"{indent}    operation_summary=\"Get unpaid invoices\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of all unpaid (pending) invoices\",\n"
        doc += f"{indent}    tags=[\"invoices\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: InvoiceSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Invoice' and action_name == 'refunded':
        doc += f"{indent}    operation_summary=\"Get refunded invoices\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of all refunded invoices\",\n"
        doc += f"{indent}    tags=[\"invoices\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: InvoiceSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Invoice' and action_name == 'mark_as_paid':
        doc += f"{indent}    operation_summary=\"Mark invoice as paid\",\n"
        doc += f"{indent}    operation_description=\"Updates the status of an invoice to 'paid'\",\n"
        doc += f"{indent}    tags=[\"invoices\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: InvoiceSerializer,\n"
        doc += f"{indent}        400: \"Bad request\",\n"
        doc += f"{indent}        404: \"Invoice not found\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Invoice' and action_name == 'refund':
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
    
    # Service-specific actions
    elif model_name == 'Service' and action_name == 'completed':
        doc += f"{indent}    operation_summary=\"Get completed services\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of all completed services\",\n"
        doc += f"{indent}    tags=[\"services\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: ServiceSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Service' and action_name == 'in_progress':
        doc += f"{indent}    operation_summary=\"Get in-progress services\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of services currently in progress\",\n"
        doc += f"{indent}    tags=[\"services\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: ServiceSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Service' and action_name == 'scheduled':
        doc += f"{indent}    operation_summary=\"Get scheduled services\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of scheduled services\",\n"
        doc += f"{indent}    tags=[\"services\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: ServiceSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    
    # Customer-specific actions
    elif model_name == 'Customer' and action_name == 'recent':
        doc += f"{indent}    operation_summary=\"Get recently added customers\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of recently added customers\",\n"
        doc += f"{indent}    tags=[\"customers\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: CustomerSerializer(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Customer' and action_name in ['vehicles', 'cars']:
        doc += f"{indent}    operation_summary=\"Get customer vehicles\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of vehicles belonging to a customer\",\n"
        doc += f"{indent}    tags=[\"customers\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: VehicleSerializer(many=True),\n"
        doc += f"{indent}        404: \"Customer not found\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    
    # Vehicle-specific actions
    elif model_name == 'Vehicle' and action_name == 'services':
        doc += f"{indent}    operation_summary=\"Get vehicle services\",\n"
        doc += f"{indent}    operation_description=\"Returns a list of services performed on a vehicle\",\n"
        doc += f"{indent}    tags=[\"vehicles\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: ServiceSerializer(many=True),\n"
        doc += f"{indent}        404: \"Vehicle not found\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'Vehicle' and action_name == 'history':
        doc += f"{indent}    operation_summary=\"Get vehicle service history\",\n"
        doc += f"{indent}    operation_description=\"Returns the complete service history for a vehicle\",\n"
        doc += f"{indent}    tags=[\"vehicles\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Vehicle service history\",\n"
        doc += f"{indent}        404: \"Vehicle not found\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    
    # User-specific actions
    elif model_name == 'User' and action_name == 'me':
        doc += f"{indent}    operation_summary=\"Get current user\",\n"
        doc += f"{indent}    operation_description=\"Returns information about the currently authenticated user\",\n"
        doc += f"{indent}    tags=[\"users\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: UserSerializer,\n"
        doc += f"{indent}        401: \"Unauthorized\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif model_name == 'User' and action_name == 'change_password':
        doc += f"{indent}    operation_summary=\"Change user password\",\n"
        doc += f"{indent}    operation_description=\"Changes the password for the current user\",\n"
        doc += f"{indent}    tags=[\"users\"],\n"
        doc += f"{indent}    request_body=PasswordChangeSerializer,\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Password changed successfully\",\n"
        doc += f"{indent}        400: \"Invalid password data\",\n"
        doc += f"{indent}        401: \"Unauthorized\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    
    # Generic fallback for unknown actions    
    else:
        # For unknown action types, create a generic template
        operation = ' '.join([word.capitalize() if i > 0 else word for i, word in enumerate(action_name.split('_'))])
        doc += f"{indent}    operation_summary=\"{operation} {model_name.lower()}\",\n"
        doc += f"{indent}    operation_description=\"{operation} operation for {model_name.lower()}\",\n"
        doc += f"{indent}    tags=[\"{model_name.lower()}s\"],\n"
        
        # Add request body for actions that likely modify data
        if any(keyword in action_name for keyword in ['add', 'create', 'update', 'edit', 'set', 'change', 'modify']):
            doc += f"{indent}    request_body={serializer_name},\n"
        
        doc += f"{indent}    responses={{\n"
        if is_detail:
            doc += f"{indent}        200: {serializer_name},\n"
            doc += f"{indent}        404: \"{model_name} not found\"\n"
        else:
            doc += f"{indent}        200: {serializer_name}(many=True)\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
        
    return doc

if __name__ == "__main__":
    fix_all_endpoints() 