#!/usr/bin/env python3
"""
ECAR API Authentication Testing Script
This script tests the authentication endpoints for the ECAR API.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"
AUTH_ENDPOINTS = {
    "register": "/auth/register/",
    "login": "/auth/token/",
    "refresh": "/auth/token/refresh/",
    "change_password": "/auth/change-password/",
    "profile": "/customers/me/"
}

# Test user data
TEST_USER = {
    "username": f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}",
    "email": f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
    "password": "securepassword123",
    "password_confirm": "securepassword123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "21612345678",
    "address": "123 Test Street, Tunis"
}

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_response(response, endpoint_name):
    """Print API response details in a formatted way"""
    print(f"\n{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{endpoint_name} Response (Status: {response.status_code}){Colors.ENDC}")
    print(f"{Colors.BOLD}{'-'*80}{Colors.ENDC}")
    
    if response.status_code >= 200 and response.status_code < 300:
        status_color = Colors.OKGREEN
    else:
        status_color = Colors.FAIL
        
    print(f"{status_color}Status Code: {response.status_code}{Colors.ENDC}")
    
    try:
        # Pretty print the JSON response
        response_json = response.json()
        print(f"Response Body:\n{json.dumps(response_json, indent=4)}")
    except:
        print(f"Response Body: {response.text}")
    
    print(f"Headers: {dict(response.headers)}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}\n")
    
    return response.json() if response.status_code < 400 else None

def test_user_registration():
    """Test user registration endpoint"""
    print(f"{Colors.HEADER}Testing User Registration...{Colors.ENDC}")
    
    response = requests.post(f"{BASE_URL}{AUTH_ENDPOINTS['register']}", json=TEST_USER)
    result = print_response(response, "User Registration")
    
    if response.status_code in [200, 201]:
        print(f"{Colors.OKGREEN}✓ User registration successful{Colors.ENDC}")
        return True
    else:
        print(f"{Colors.FAIL}✗ User registration failed{Colors.ENDC}")
        return False

def test_user_login(username=None, password=None):
    """Test user login endpoint"""
    username = username or TEST_USER["username"]
    password = password or TEST_USER["password"]
    
    print(f"{Colors.HEADER}Testing User Login with {username}...{Colors.ENDC}")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}{AUTH_ENDPOINTS['login']}", json=login_data)
    tokens = print_response(response, "User Login")
    
    if response.status_code == 200 and tokens:
        print(f"{Colors.OKGREEN}✓ User login successful{Colors.ENDC}")
        return tokens
    else:
        print(f"{Colors.FAIL}✗ User login failed{Colors.ENDC}")
        return None

def test_token_refresh(refresh_token):
    """Test token refresh endpoint"""
    print(f"{Colors.HEADER}Testing Token Refresh...{Colors.ENDC}")
    
    refresh_data = {
        "refresh": refresh_token
    }
    
    response = requests.post(f"{BASE_URL}{AUTH_ENDPOINTS['refresh']}", json=refresh_data)
    result = print_response(response, "Token Refresh")
    
    if response.status_code == 200 and result and "access" in result:
        print(f"{Colors.OKGREEN}✓ Token refresh successful{Colors.ENDC}")
        return result["access"]
    else:
        print(f"{Colors.FAIL}✗ Token refresh failed{Colors.ENDC}")
        return None

def test_protected_endpoint(access_token):
    """Test access to a protected endpoint"""
    print(f"{Colors.HEADER}Testing Protected Endpoint Access...{Colors.ENDC}")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}{AUTH_ENDPOINTS['profile']}", headers=headers)
    user_profile = print_response(response, "Protected Endpoint (Customer Profile)")
    
    if response.status_code == 200:
        print(f"{Colors.OKGREEN}✓ Protected endpoint access successful{Colors.ENDC}")
        return user_profile
    else:
        print(f"{Colors.FAIL}✗ Protected endpoint access failed{Colors.ENDC}")
        return None

def test_change_password(access_token, old_password, new_password):
    """Test password change endpoint"""
    print(f"{Colors.HEADER}Testing Password Change...{Colors.ENDC}")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    password_data = {
        "old_password": old_password,
        "new_password": new_password,
        "confirm_password": new_password
    }
    
    response = requests.patch(
        f"{BASE_URL}{AUTH_ENDPOINTS['change_password']}", 
        json=password_data,
        headers=headers
    )
    result = print_response(response, "Password Change")
    
    if response.status_code == 200:
        print(f"{Colors.OKGREEN}✓ Password change successful{Colors.ENDC}")
        return True
    else:
        print(f"{Colors.FAIL}✗ Password change failed{Colors.ENDC}")
        return False

def run_full_auth_flow():
    """Run the complete authentication flow test"""
    print(f"{Colors.BOLD}{Colors.HEADER}Starting ECAR API Authentication Testing{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")
    
    # Step 1: Register a new user
    registration_success = test_user_registration()
    
    # If registration fails, try to login with existing user
    if not registration_success:
        print(f"{Colors.WARNING}Registration failed. Trying to login with existing user...{Colors.ENDC}")
    
    # Step 2: Login with the user
    tokens = test_user_login()
    if not tokens:
        print(f"{Colors.FAIL}Login failed. Cannot proceed with further tests.{Colors.ENDC}")
        return
    
    access_token = tokens["access"]
    refresh_token = tokens["refresh"]
    
    # Step 3: Access a protected endpoint with the access token
    user_profile = test_protected_endpoint(access_token)
    
    # Step 4: Test token refresh
    new_access_token = test_token_refresh(refresh_token)
    
    if new_access_token:
        # Step 5: Test accessing protected endpoint with the new token
        print(f"{Colors.HEADER}Testing Protected Endpoint with Refreshed Token...{Colors.ENDC}")
        test_protected_endpoint(new_access_token)
        
        # Step 6: Test password change (commented out to avoid breaking subsequent tests)
        # new_password = "newSecurePassword456"
        # if test_change_password(new_access_token, TEST_USER["password"], new_password):
        #     # Try logging in with the new password
        #     TEST_USER["password"] = new_password
        #     test_user_login()
    
    print(f"{Colors.BOLD}{Colors.HEADER}Authentication Testing Complete{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

if __name__ == "__main__":
    run_full_auth_flow() 