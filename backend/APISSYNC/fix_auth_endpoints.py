#!/usr/bin/env python3
"""
Script to add Swagger documentation to authentication-related endpoints.
This script handles function-based views for login, logout, token refresh, etc.
"""

import os
import re

def fix_auth_endpoints():
    # Paths inside the Docker container
    views_file = '/app/api/views.py'
    serializers_file = '/app/api/serializers.py'
    
    if not os.path.exists(views_file):
        print(f"Error: {views_file} not found.")
        return
        
    # Read serializers file to check which serializers exist
    available_serializers = []
    if os.path.exists(serializers_file):
        with open(serializers_file, 'r') as f:
            serializers_content = f.read()
            # Find all serializer classes
            serializer_pattern = re.compile(r'class\s+(\w+Serializer)\s*\(', re.DOTALL)
            for match in serializer_pattern.finditer(serializers_content):
                available_serializers.append(match.group(1))
    
    print(f"Found these serializers: {', '.join(available_serializers)}")
    
    with open(views_file, 'r') as f:
        content = f.read()
    
    # Create a backup
    backup_file = f"{views_file}.auth.bak"
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Created backup at {backup_file}")
    
    updated_content = content
    
    # List of common auth-related function names
    auth_functions = [
        'login', 'logout', 'register', 'custom_login', 'custom_logout', 
        'token_refresh', 'password_reset', 'password_change', 'verify_email'
    ]
    
    # Find function-based views that might need documentation
    function_pattern = re.compile(r'@api_view\(\s*\[.*?\]\s*\)\s*def\s+(\w+)\s*\(', re.DOTALL)
    functions_found = function_pattern.finditer(content)
    
    # Check for swagger documentation
    swagger_pattern = re.compile(r'@swagger_auto_schema\s*\(.*?\)\s*@api_view', re.DOTALL)
    
    # Tracking variables
    modified_functions = 0
    
    # Process each function
    for match in function_pattern.finditer(content):
        function_name = match.group(1)
        function_start = match.start()
        
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
        
        # Create documentation based on function name
        doc = create_auth_documentation(function_name, indent, available_serializers)
        
        if not doc:
            print(f"Skipping unknown function: {function_name}")
            continue
            
        # Insert the documentation before the @api_view decorator
        api_view_pos = content.rfind('@api_view', 0, function_start)
        if api_view_pos == -1:
            print(f"Could not find @api_view decorator for function '{function_name}'.")
            continue
            
        updated_content = updated_content[:api_view_pos] + doc + updated_content[api_view_pos:]
        modified_functions += 1
        print(f"✅ Added documentation to function '{function_name}'")
    
    # Save the updated file
    if modified_functions > 0:
        with open(views_file, 'w') as f:
            f.write(updated_content)
        print(f"✅ Successfully updated documentation for {modified_functions} authentication functions.")
    else:
        print("No authentication-related functions found or all already have documentation.")

def create_auth_documentation(function_name, indent, available_serializers):
    """Create appropriate Swagger documentation for auth-related functions."""
    
    doc = f"{indent}@swagger_auto_schema(\n"
    
    if 'login' in function_name:
        doc += f"{indent}    operation_summary=\"User login\",\n"
        doc += f"{indent}    operation_description=\"Authenticates a user and returns a JWT token\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        
        # Only add request_body if serializer exists
        if 'LoginSerializer' in available_serializers:
            doc += f"{indent}    request_body=LoginSerializer,\n"
        else:
            doc += f"{indent}    request_body=openapi.Schema(\n"
            doc += f"{indent}        type=openapi.TYPE_OBJECT,\n"
            doc += f"{indent}        properties={{\n"
            doc += f"{indent}            'username': openapi.Schema(type=openapi.TYPE_STRING),\n"
            doc += f"{indent}            'password': openapi.Schema(type=openapi.TYPE_STRING, format='password'),\n"
            doc += f"{indent}        }},\n"
            doc += f"{indent}        required=['username', 'password']\n"
            doc += f"{indent}    ),\n"
        
        # Only add response schema if serializer exists
        if 'TokenObtainPairResponseSerializer' in available_serializers:
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: TokenObtainPairResponseSerializer,\n"
            doc += f"{indent}        400: \"Invalid credentials\",\n"
            doc += f"{indent}        401: \"Unauthorized\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: openapi.Schema(\n"
            doc += f"{indent}            type=openapi.TYPE_OBJECT,\n"
            doc += f"{indent}            properties={{\n"
            doc += f"{indent}                'access': openapi.Schema(type=openapi.TYPE_STRING),\n"
            doc += f"{indent}                'refresh': openapi.Schema(type=openapi.TYPE_STRING),\n"
            doc += f"{indent}            }}\n"
            doc += f"{indent}        ),\n"
            doc += f"{indent}        400: \"Invalid credentials\",\n"
            doc += f"{indent}        401: \"Unauthorized\"\n"
            doc += f"{indent}    }}\n"
        
        doc += f"{indent})\n"
    elif 'logout' in function_name:
        doc += f"{indent}    operation_summary=\"User logout\",\n"
        doc += f"{indent}    operation_description=\"Logs out a user by invalidating their token\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Successfully logged out\",\n"
        doc += f"{indent}        401: \"Unauthorized\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
    elif 'register' in function_name:
        doc += f"{indent}    operation_summary=\"User registration\",\n"
        doc += f"{indent}    operation_description=\"Registers a new user account\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        
        # Only add request_body if serializer exists
        if 'UserRegistrationSerializer' in available_serializers:
            doc += f"{indent}    request_body=UserRegistrationSerializer,\n"
        else:
            doc += f"{indent}    request_body=openapi.Schema(\n"
            doc += f"{indent}        type=openapi.TYPE_OBJECT,\n"
            doc += f"{indent}        properties={{\n"
            doc += f"{indent}            'username': openapi.Schema(type=openapi.TYPE_STRING),\n"
            doc += f"{indent}            'email': openapi.Schema(type=openapi.TYPE_STRING, format='email'),\n"
            doc += f"{indent}            'password': openapi.Schema(type=openapi.TYPE_STRING, format='password'),\n"
            doc += f"{indent}        }},\n"
            doc += f"{indent}        required=['username', 'email', 'password']\n"
            doc += f"{indent}    ),\n"
        
        # Only add response schema if serializer exists
        if 'UserSerializer' in available_serializers:
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        201: UserSerializer,\n"
            doc += f"{indent}        400: \"Invalid data\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        201: \"User created successfully\",\n"
            doc += f"{indent}        400: \"Invalid data\"\n"
            doc += f"{indent}    }}\n"
            
        doc += f"{indent})\n"
    elif 'token_refresh' in function_name or 'refresh' in function_name:
        doc += f"{indent}    operation_summary=\"Refresh authentication token\",\n"
        doc += f"{indent}    operation_description=\"Refreshes an expired JWT token\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        
        if 'RefreshTokenSerializer' in available_serializers:
            doc += f"{indent}    request_body=RefreshTokenSerializer,\n"
        else:
            doc += f"{indent}    request_body=openapi.Schema(\n"
            doc += f"{indent}        type=openapi.TYPE_OBJECT,\n"
            doc += f"{indent}        properties={{\n"
            doc += f"{indent}            'refresh': openapi.Schema(type=openapi.TYPE_STRING),\n"
            doc += f"{indent}        }},\n"
            doc += f"{indent}        required=['refresh']\n"
            doc += f"{indent}    ),\n"
        
        if 'TokenRefreshResponseSerializer' in available_serializers:
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: TokenRefreshResponseSerializer,\n"
            doc += f"{indent}        401: \"Invalid token\"\n"
            doc += f"{indent}    }}\n"
        else:
            doc += f"{indent}    responses={{\n"
            doc += f"{indent}        200: openapi.Schema(\n"
            doc += f"{indent}            type=openapi.TYPE_OBJECT,\n"
            doc += f"{indent}            properties={{\n"
            doc += f"{indent}                'access': openapi.Schema(type=openapi.TYPE_STRING),\n"
            doc += f"{indent}            }}\n"
            doc += f"{indent}        ),\n"
            doc += f"{indent}        401: \"Invalid token\"\n"
            doc += f"{indent}    }}\n"
            
        doc += f"{indent})\n"
    else:
        # Generic auth-related function
        function_display = ' '.join([word.capitalize() if i > 0 else word for i, word in enumerate(function_name.split('_'))])
        doc += f"{indent}    operation_summary=\"{function_display}\",\n"
        doc += f"{indent}    operation_description=\"{function_display} authentication operation\",\n"
        doc += f"{indent}    tags=[\"authentication\"],\n"
        doc += f"{indent}    responses={{\n"
        doc += f"{indent}        200: \"Success\",\n"
        doc += f"{indent}        400: \"Bad request\",\n"
        doc += f"{indent}        401: \"Unauthorized\"\n"
        doc += f"{indent}    }}\n"
        doc += f"{indent})\n"
        
    return doc

if __name__ == "__main__":
    fix_auth_endpoints() 