#!/usr/bin/env python3
"""
Script to add Swagger documentation to all InvoiceViewSet actions.
For use inside the Docker container.
"""

import os
import re

def fix_invoice_docs():
    # Paths inside the Docker container
    views_file = '/app/api/views.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{views_file}.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    # Define documentation templates for various actions
    docs = {
        "refund": """@swagger_auto_schema(
    operation_summary="Process refund for invoice",
    operation_description="Refund a paid invoice and record refund details",
    tags=["invoices"],
    request_body=RefundRequestSerializer,
    responses={
        200: InvoiceSerializer,
        400: "Bad request - invoice cannot be refunded",
        404: "Invoice not found"
    }
)""",
        "paid": """@swagger_auto_schema(
    operation_summary="Get paid invoices",
    operation_description="Returns a list of all paid invoices",
    tags=["invoices"],
    responses={
        200: InvoiceSerializer(many=True)
    }
)""",
        "unpaid": """@swagger_auto_schema(
    operation_summary="Get unpaid invoices",
    operation_description="Returns a list of all unpaid (pending) invoices",
    tags=["invoices"],
    responses={
        200: InvoiceSerializer(many=True)
    }
)""",
        "refunded": """@swagger_auto_schema(
    operation_summary="Get refunded invoices",
    operation_description="Returns a list of all refunded invoices",
    tags=["invoices"],
    responses={
        200: InvoiceSerializer(many=True)
    }
)""",
        "statistics": """@swagger_auto_schema(
    operation_summary="Get invoice statistics",
    operation_description="Returns statistics about invoices including counts by status and financial data",
    tags=["invoices"],
    responses={
        200: openapi.Response(
            description="Invoice statistics",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'total_count': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'status_counts': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'financial': openapi.Schema(type=openapi.TYPE_OBJECT),
                    'monthly': openapi.Schema(type=openapi.TYPE_OBJECT),
                }
            )
        )
    }
)""",
        "mark_as_paid": """@swagger_auto_schema(
    operation_summary="Mark invoice as paid",
    operation_description="Updates the status of an invoice to 'paid'",
    tags=["invoices"],
    responses={
        200: InvoiceSerializer,
        400: "Bad request",
        404: "Invoice not found"
    }
)"""
    }
    
    updated_content = content
    actions_updated = 0
    
    # InvoiceViewSet class content
    invoice_viewset_pattern = re.compile(r'class\s+InvoiceViewSet\(.*?\):.*?(?=class|\Z)', re.DOTALL)
    invoice_viewset_match = invoice_viewset_pattern.search(content)
    
    if not invoice_viewset_match:
        print("Could not find InvoiceViewSet in views.py")
        return
    
    invoice_viewset_content = invoice_viewset_match.group(0)
    
    # Find all @action decorators in InvoiceViewSet without @swagger_auto_schema
    for action_name, doc_template in docs.items():
        # Check if action already has swagger docs
        swagger_check_pattern = re.compile(r'@swagger_auto_schema\s*\(.*?\)\s*@action.*?def\s+' + action_name + r'\s*\(', re.DOTALL)
        if swagger_check_pattern.search(invoice_viewset_content):
            print(f"Action '{action_name}' already has swagger documentation.")
            continue
        
        # Find the action without swagger docs
        action_pattern = re.compile(r'(class\s+InvoiceViewSet.*?)(@action.*?def\s+' + action_name + r'\s*\()', re.DOTALL)
        action_match = action_pattern.search(updated_content)
        
        if not action_match:
            print(f"Could not find action '{action_name}' in InvoiceViewSet.")
            continue
        
        # Add documentation
        updated_content = action_pattern.sub(r'\1' + doc_template + r'\n\2', updated_content)
        actions_updated += 1
        print(f"✅ Added documentation to action '{action_name}'")
    
    # If no changes were made, return
    if actions_updated == 0:
        print("No changes were made to the documentation.")
        return
    
    # Save the updated file
    with open(views_file, 'w') as f:
        f.write(updated_content)
    
    print(f"✅ Successfully added documentation to {actions_updated} actions in InvoiceViewSet.")
    print("️⚠️ You'll need to add a RefundRequestSerializer if it doesn't exist already.")

if __name__ == "__main__":
    # Add import for openapi at the top of the file
    views_file = '/app/api/views.py'
    if os.path.exists(views_file):
        with open(views_file, 'r') as f:
            content = f.read()
        
        # Check if openapi is already imported
        if 'from drf_yasg import openapi' not in content:
            updated_content = content.replace(
                'from drf_yasg.utils import swagger_auto_schema',
                'from drf_yasg import openapi\nfrom drf_yasg.utils import swagger_auto_schema'
            )
            with open(views_file, 'w') as f:
                f.write(updated_content)
            print("Added missing openapi import.")
    
    fix_invoice_docs() 