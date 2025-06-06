#!/usr/bin/env python3
"""
Improved script to add Swagger documentation to authentication-related endpoints.
This script handles function-based views with multiple HTTP methods.
"""

import os
import re

def fix_auth_endpoints():
    # Paths inside the Docker container
    views_file = '/app/api/views.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{views_file}.auth_improved.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    updated_content = content
    
    # List of common auth-related function names
    auth_functions = [
        'login', 'logout', 'register', 'custom_login', 'custom_logout', 
        'token_refresh', 'password_reset', 'password_change', 'verify_email',
        'admin_login'
    ]
    
    # Find function-based views that might need documentation
    # This pattern captures both the function name and the HTTP methods
    function_pattern = re.compile(r'@api_view\(\s*\[(.*?)\]\s*\)\s*def\s+(\w+)\s*\(', re.DOTALL)
    
    # Check for swagger documentation
    swagger_pattern = re.compile(r'@swagger_auto_schema\s*\(.*?\)\s*@api_view', re.DOTALL)
    
    # Tracking variables
    modified_functions = 0
    
    # Process each function
    for match in function_pattern.finditer(content):
        http_methods_str = match.group(1)  # This will be something like "'GET', 'POST'"
        function_name = match.group(2)
        function_start = match.start()
        
        # Parse the HTTP methods
        http_methods = []
        for method_match in re.finditer(r"'([A-Z]+)'", http_methods_str):
            http_methods.append(method_match.group(1))
        
        if not http_methods:
            print(f"Could not parse HTTP methods for function '{function_name}'")
            continue
        
        # Check if this is an auth-related function
        is_auth_related = any(auth_name in function_name for auth_name in auth_functions)
        if not is_auth_related:
            continue
        
        # Check if function already has swagger documentation
        has_swagger = False
        for swagger_match in swagger_pattern.finditer(content):
            if swagger_match.end() > function_start and swagger_match.start() < function_start:
                has_swagger = True
                break
        
        if has_swagger:
            print(f"Function '{function_name}' already has swagger documentation.")
            continue
        
        # Find the indentation before the function
        indent_match = re.search(r'\n(\s*)@api_view', content[:function_start])
        indent = indent_match.group(1) if indent_match else ''
        
        # Create documentation for each HTTP method
        docs = []
        for method in http_methods:
            doc = create_auth_documentation(function_name, method, indent)
            if doc:
                docs.append(doc)
            else:
                print(f"Skipping unknown function: {function_name} with method {method}")
                
        if not docs:
            continue
            
        # Insert the documentation before the @api_view decorator
        api_view_pos = content.rfind('@api_view', 0, function_start)
        if api_view_pos == -1:
            print(f"Could not find @api_view decorator for function '{function_name}'.")
            continue
            
        # Add all documentation decorators
        for doc in docs:
            updated_content = updated_content[:api_view_pos] + doc + updated_content[api_view_pos:]
        
        modified_functions += 1
        print(f"✅ Added documentation to function '{function_name}' for methods: {', '.join(http_methods)}")
    
    # Save the updated file
    if modified_functions > 0:
        with open(views_file, 'w') as f:
            f.write(updated_content)
        print(f"✅ Successfully updated documentation for {modified_functions} authentication functions.")
    else:
        print("No authentication-related functions found or all already have documentation.")

def create_auth_documentation(function_name, method, indent):
    """Create appropriate Swagger documentation for auth-related functions with specific HTTP method."""
    
    doc = f"{indent}@swagger_auto_schema(\n"
    doc += f"{indent}    method='{method}',\n"  # Specify the HTTP method
    
    if 'login' in function_name:
        if method == 'POST':
            doc += f"{indent}    operation_summary=\"User login\",\n"
            doc += f"{indent}    operation_description=\"Authenticates a user and returns a JWT token\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    request_body=LoginSerializer,\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: TokenObtainPairResponseSerializer,\n"
            doc += f"{indent}        400: \"Invalid credentials\",\n"
            doc += f"{indent}        401: \"Unauthorized\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    operation_summary=\"Login form\",\n"
            doc += f"{indent}    operation_description=\"Returns the login form\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Login form\"\n"
            doc += f"{indent}    }}\n"
    elif 'logout' in function_name:
        doc += f"{indent}    operation_summary=\"User logout\",\n"
        doc += f"{indent}    operation_description=\"Logs out a user by invalidating their token\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Successfully logged out\",\n"
        doc += f"{indent}        401: \"Unauthorized\"\n"
        doc += f"{indent}    }}\n"
    elif 'register' in function_name:
        if method == 'POST':
            doc += f"{indent}    operation_summary=\"User registration\",\n"
            doc += f"{indent}    operation_description=\"Registers a new user account\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    request_body=UserRegistrationSerializer,\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        201: UserSerializer,\n"
            doc += f"{indent}        400: \"Invalid data\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    operation_summary=\"Registration form\",\n"
            doc += f"{indent}    operation_description=\"Returns the registration form\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Registration form\"\n"
            doc += f"{indent}    }}\n"
    elif 'token_refresh' in function_name or 'refresh' in function_name:
        doc += f"{indent}    operation_summary=\"Refresh authentication token\",\n"
        doc += f"{indent}    operation_description=\"Refreshes an expired JWT token\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        doc += f"{indent}    request_body=RefreshTokenSerializer,\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: TokenRefreshResponseSerializer,\n"
        doc += f"{indent}        401: \"Invalid token\"\n"
        doc += f"{indent}    }}\n"
    elif 'password_reset' in function_name:
        if method == 'POST':
            doc += f"{indent}    operation_summary=\"Reset password\",\n"
            doc += f"{indent}    operation_description=\"Sends a password reset email to the user\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    request_body=PasswordResetSerializer,\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Password reset email sent\",\n"
            doc += f"{indent}        400: \"Invalid email\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    operation_summary=\"Password reset form\",\n"
            doc += f"{indent}    operation_description=\"Returns the password reset form\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Password reset form\"\n"
            doc += f"{indent}    }}\n"
    elif 'password_change' in function_name:
        if method == 'POST':
            doc += f"{indent}    operation_summary=\"Change password\",\n"
            doc += f"{indent}    operation_description=\"Changes the user's password\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    request_body=PasswordChangeSerializer,\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Password changed successfully\",\n"
            doc += f"{indent}        400: \"Invalid password data\",\n"
            doc += f"{indent}        401: \"Unauthorized\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    operation_summary=\"Password change form\",\n"
            doc += f"{indent}    operation_description=\"Returns the password change form\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Password change form\",\n"
            doc += f"{indent}        401: \"Unauthorized\"\n"
            doc += f"{indent}    }}\n"
    elif 'verify_email' in function_name:
        doc += f"{indent}    operation_summary=\"Verify email\",\n"
        doc += f"{indent}    operation_description=\"Verifies a user's email address\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        doc += f"{indent}    request_body=EmailVerificationSerializer,\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Email verified successfully\",\n"
        doc += f"{indent}        400: \"Invalid verification token\"\n"
        doc += f"{indent}    }}\n"
    elif 'admin_login' in function_name:
        if method == 'POST':
            doc += f"{indent}    operation_summary=\"Admin login\",\n"
            doc += f"{indent}    operation_description=\"Authenticates an admin user and returns a JWT token\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    request_body=AdminLoginSerializer,\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: TokenObtainPairResponseSerializer,\n"
            doc += f"{indent}        400: \"Invalid credentials\",\n"
            doc += f"{indent}        401: \"Unauthorized\",\n"
            doc += f"{indent}        403: \"Not an admin user\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    operation_summary=\"Admin login form\",\n"
            doc += f"{indent}    operation_description=\"Returns the admin login form\",\n"
            doc += f"{indent}    tags=[\"authentication\"],\n"
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: \"Admin login form\"\n"
            doc += f"{indent}    }}\n"
    else:
        # Generic auth-related function
        function_display = ' '.join([word.capitalize() if i > 0 else word for i, word in enumerate(function_name.split('_'))])
        doc += f"{indent}    operation_summary=\"{function_display}\",\n"
        doc += f"{indent}    operation_description=\"{function_display} authentication operation\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        
        # Add request body for POST, PUT, PATCH methods
        if method in ['POST', 'PUT', 'PATCH']:
            doc += f"{indent}    request_body=openapi.Schema(type=openapi.TYPE_OBJECT),\n"
            
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Success\",\n"
        if method in ['POST', 'PUT', 'PATCH']:
            doc += f"{indent}        400: \"Bad request\",\n"
        doc += f"{indent}        401: \"Unauthorized\"\n"
        doc += f"{indent}    }}\n"
        
    doc += f"{indent})\n"
    return doc

if __name__ == "__main__":
    fix_auth_endpoints() 