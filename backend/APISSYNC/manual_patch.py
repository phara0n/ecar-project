#!/usr/bin/env python3
"""
Script to manually add Swagger documentation to the admin_login function.
This script is designed to be run inside the Docker container.
"""

import os
import re

def add_admin_login_docs():
    """Add Swagger documentation to the admin_login function."""
    views_file = '/app/api/views.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{views_file}.manual.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    # Find the admin_login function - more specific pattern
    admin_login_pattern = re.compile(r'@api_view\(\[\s*[\'"]POST[\'"]\s*\]\)\s*@permission_classes.*?\]\)\s*def\s+admin_login\s*\(', re.DOTALL)
    admin_login_match = admin_login_pattern.search(content)
    
    if not admin_login_match:
        print("Could not find admin_login function with expected decorators")
        # Try a simpler pattern
        admin_login_pattern = re.compile(r'def\s+admin_login\s*\(', re.DOTALL)
        admin_login_match = admin_login_pattern.search(content)
        
        if not admin_login_match:
            print("Could not find admin_login function at all")
            return
        else:
            # Find the line before the function to insert the documentation
            function_pos = admin_login_match.start()
            prev_newline = content.rfind('\n', 0, function_pos)
            insert_pos = prev_newline + 1 if prev_newline >= 0 else 0
            print(f"Found admin_login function at position {function_pos}")
    else:
        # Get position to insert documentation before the @api_view decorator
        insert_pos = admin_login_match.start()
        print(f"Found admin_login function with decorators at position {insert_pos}")
    
    # Find indentation
    prev_newline = content.rfind('\n', 0, insert_pos)
    indentation = ''
    if prev_newline >= 0:
        indent_start = prev_newline + 1
        indent_end = insert_pos
        indentation = content[indent_start:indent_end]
    
    # Add import if needed
    if 'from drf_yasg import openapi' not in content:
        if 'from drf_yasg.utils import swagger_auto_schema' in content:
            content = content.replace(
                'from drf_yasg.utils import swagger_auto_schema',
                'from drf_yasg import openapi\nfrom drf_yasg.utils import swagger_auto_schema'
            )
        else:
            content = 'from drf_yasg import openapi\nfrom drf_yasg.utils import swagger_auto_schema\n\n' + content
    
    # Create simple documentation
    doc_string = f"""
{indentation}@swagger_auto_schema(
{indentation}    operation_summary="Admin login",
{indentation}    operation_description="Authenticates an admin user and returns a JWT token",
{indentation}    tags=["authentication"],
{indentation}    request_body=openapi.Schema(
{indentation}        type=openapi.TYPE_OBJECT,
{indentation}        properties={{
{indentation}            'username': openapi.Schema(type=openapi.TYPE_STRING),
{indentation}            'password': openapi.Schema(type=openapi.TYPE_STRING, format='password'),
{indentation}        }},
{indentation}        required=['username', 'password']
{indentation}    ),
{indentation}    responses={{
{indentation}        200: openapi.Schema(
{indentation}            type=openapi.TYPE_OBJECT,
{indentation}            properties={{
{indentation}                'token': openapi.Schema(type=openapi.TYPE_STRING),
{indentation}            }}
{indentation}        ),
{indentation}        400: "Invalid credentials",
{indentation}        401: "Unauthorized"
{indentation}    }}
{indentation})
"""
    
    # Add documentation
    updated_content = content[:insert_pos] + doc_string + content[insert_pos:]
    
    with open(views_file, 'w') as f:
        f.write(updated_content)
    
    print('✅ Successfully added documentation to admin_login function')

if __name__ == "__main__":
    add_admin_login_docs() 