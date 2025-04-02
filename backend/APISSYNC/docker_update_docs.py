#!/usr/bin/env python3
"""
Script to update Swagger documentation in the Docker backend
"""
import re
import os
import sys
import shutil
from drf_yasg import openapi

print("Starting Swagger documentation update...")

# Path to the views.py file
views_path = '/app/api/views.py'
backup_path = views_path + '.docker.bak'

if not os.path.exists(views_path):
    print(f"❌ Error: File not found at {views_path}")
    print("Current directory: " + os.getcwd())
    print("Files in current directory:")
    print(os.listdir('.'))
    
    # Try finding the views.py file
    for root, dirs, files in os.walk('/app'):
        if 'views.py' in files:
            print(f"Found views.py at: {os.path.join(root, 'views.py')}")
    
    sys.exit(1)

# Create a backup of the views.py file
shutil.copy2(views_path, backup_path)
print(f"✅ Created backup at {backup_path}")

def fix_admin_login_docs():
    """Add proper Swagger documentation to the admin_login function."""
    try:
        with open(views_path, 'r') as file:
            content = file.read()
            
        # Check if admin_login already has proper Swagger documentation with method parameter
        admin_login_pattern = r'@swagger_auto_schema\(\s*method=\'post\''
        if re.search(admin_login_pattern, content):
            print("✅ admin_login function already has proper Swagger documentation with method parameter")
            return
            
        # Find the admin_login function and check if it has duplicate Swagger annotations
        duplicate_pattern = r'@swagger_auto_schema\(.*?\)\s*@swagger_auto_schema\(.*?def admin_login'
        duplicate_match = re.search(duplicate_pattern, content, re.DOTALL)
        
        if duplicate_match:
            print("⚠️ Found duplicate Swagger annotations for admin_login, fixing...")
            # Remove one of the duplicates
            fixed_content = re.sub(
                r'(@swagger_auto_schema\(.*?\))\s*(@swagger_auto_schema\(.*?)def admin_login',
                r'\2def admin_login',
                content,
                flags=re.DOTALL
            )
            with open(views_path, 'w') as file:
                file.write(fixed_content)
            print("✅ Fixed duplicate Swagger annotations for admin_login")
            return
            
        # Find any admin_login function without proper Swagger docs
        admin_login_pattern = r'((?:@csrf_exempt\s*\n\s*)?@api_view\(\[.*?\'POST\'.*?\]\)\s*\n\s*@permission_classes\(\[permissions\.AllowAny\]\))\s*\n\s*def admin_login\(request\):'
        admin_login_match = re.search(admin_login_pattern, content, re.DOTALL)
        
        if not admin_login_match:
            print("⚠️ admin_login function pattern not found")
            # Let's try a more general pattern
            admin_login_pattern = r'def admin_login\(request\):'
            admin_login_pos = content.find('def admin_login(request):')
            if admin_login_pos == -1:
                print("❌ admin_login function not found in the file")
                return
                
            # Go back about 10 lines to find the right spot for insertion
            preceding_content = content[:admin_login_pos].split('\n')
            insert_point = max(0, admin_login_pos - sum(len(line) + 1 for line in preceding_content[-10:]))
            
            # Insert the Swagger documentation at the right spot
            swagger_docs = """@swagger_auto_schema(
    method='post',
    operation_summary="Admin login",
    operation_description="Special login endpoint for admin users. Returns a JWT token upon successful authentication.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['username', 'password'],
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Admin username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Admin password'),
        }
    ),
    responses={
        200: openapi.Response('Successful authentication', schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'success': openapi.Schema(type=openapi.TYPE_STRING, description='Success message'),
                'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
                'is_staff': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Staff status'),
                'is_superuser': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Superuser status')
            }
        )),
        400: 'Invalid credentials',
        401: 'Authentication failed',
        403: 'Permission denied'
    },
    tags=['Authentication']
)
"""
            # Create the modified content with the Swagger documentation
            modified_content = content[:insert_point] + swagger_docs + content[insert_point:]
            
            with open(views_path, 'w') as file:
                file.write(modified_content)
            print("✅ Added Swagger documentation to admin_login function using alternate approach")
            return
        
        # Found the admin_login function with the pattern, now add Swagger docs
        swagger_docs = r'''\1
@swagger_auto_schema(
    method='post',
    operation_summary="Admin login",
    operation_description="Special login endpoint for admin users. Returns a JWT token upon successful authentication.",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['username', 'password'],
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Admin username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Admin password'),
        }
    ),
    responses={
        200: openapi.Response('Successful authentication', schema=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'success': openapi.Schema(type=openapi.TYPE_STRING, description='Success message'),
                'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
                'is_staff': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Staff status'),
                'is_superuser': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Superuser status')
            }
        )),
        400: 'Invalid credentials',
        401: 'Authentication failed',
        403: 'Permission denied'
    },
    tags=['Authentication']
)
def admin_login(request):'''

        # Add the Swagger documentation
        modified_content = re.sub(admin_login_pattern, swagger_docs, content, flags=re.DOTALL)
        
        # Write the modified content back to the file
        if modified_content != content:
            with open(views_path, 'w') as file:
                file.write(modified_content)
            print("✅ Successfully added Swagger documentation to admin_login function")
        else:
            print("⚠️ The modified content didn't change. This might indicate a regex issue.")
            
    except Exception as e:
        print(f"❌ Error in fix_admin_login_docs: {e}")

# Run the fix
if __name__ == "__main__":
    print("Running admin_login Swagger documentation update...")
    fix_admin_login_docs()
    print("Swagger documentation update completed!") 