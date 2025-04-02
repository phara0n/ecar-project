#!/usr/bin/env python3
"""
Script to add Swagger documentation to the InvoiceViewSet refund action.
For use inside the Docker container.
"""

import os
import re

def fix_refund_docs():
    # Paths inside the Docker container
    views_file = '/app/api/views.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Check if the refund action already has documentation
    if '@swagger_auto_schema' in content and 'refund' in content and 'RefundRequestSerializer' in content:
        print("Refund action already has documentation.")
        return
    
    # Define the documentation to add
    refund_docs = """@swagger_auto_schema(
    operation_summary="Process refund for invoice",
    operation_description="Refund a paid invoice and record refund details",
    tags=["invoices"],
    request_body=RefundRequestSerializer,
    responses={
        200: InvoiceSerializer,
        400: "Bad request - invoice cannot be refunded",
        404: "Invoice not found"
    }
)"""
    
    # Find the refund action in InvoiceViewSet
    pattern = re.compile(r'(class\s+InvoiceViewSet.*?)(@action.*?detail=True.*?def\s+refund\s*\()', re.DOTALL)
    match = pattern.search(content)
    
    if not match:
        print("Could not find the refund action in InvoiceViewSet.")
        return
    
    # Add documentation
    updated_content = pattern.sub(r'\1' + refund_docs + r'\n\2', content)
    
    # Create a backup
    backup_file = f"{views_file}.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    # Save the updated file
    with open(views_file, 'w') as f:
        f.write(updated_content)
    
    print("✅ Successfully added documentation to the refund action.")

if __name__ == "__main__":
    fix_refund_docs() 