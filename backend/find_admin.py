#!/usr/bin/env python3
"""
ECAR API Admin Credential Finder
This script tries various common admin credentials to find valid login credentials.
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000/api"
AUTH_ENDPOINT = "/auth/token/"

# Common admin usernames and passwords to try
USERNAMES = [
    "admin",
    "admin@ecar.tn",
    "admin@example.com",
    "administrator",
    "root",
    "superuser",
    "mehd"
]

PASSWORDS = [
    "admin",
    "password",
    "admin123",
    "adminpassword",
    "pass123",
    "ecar123",
    "123456",
    "superuser",
    "changeme"
]

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

def try_login(username, password):
    """Try to login with the given credentials"""
    print(f"{Colors.HEADER}Trying login with {username}:{password}...{Colors.ENDC}", end="", flush=True)
    
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}{AUTH_ENDPOINT}", json=login_data, timeout=5)
        
        if response.status_code == 200 and "access" in response.json():
            print(f"{Colors.OKGREEN} SUCCESS!{Colors.ENDC}")
            return True, response.json()
        else:
            print(f"{Colors.FAIL} FAILED{Colors.ENDC}")
            return False, None
            
    except Exception as e:
        print(f"{Colors.FAIL} ERROR: {str(e)}{Colors.ENDC}")
        return False, None

def find_admin_credentials():
    """Find valid admin credentials"""
    print(f"{Colors.BOLD}{Colors.HEADER}Starting ECAR API Admin Credential Finder{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")
    
    found = False
    for username in USERNAMES:
        for password in PASSWORDS:
            success, response = try_login(username, password)
            if success:
                found = True
                print(f"\n{Colors.OKGREEN}Found valid credentials:{Colors.ENDC}")
                print(f"{Colors.OKGREEN}Username: {username}{Colors.ENDC}")
                print(f"{Colors.OKGREEN}Password: {password}{Colors.ENDC}")
                print(f"\n{Colors.OKBLUE}JWT Tokens:{Colors.ENDC}")
                print(f"{Colors.OKBLUE}Access Token: {response['access']}{Colors.ENDC}")
                print(f"{Colors.OKBLUE}Refresh Token: {response['refresh']}{Colors.ENDC}")
                print(f"\n{Colors.BOLD}Use these credentials in your testing scripts.{Colors.ENDC}")
                
                # Update the vehicle_test.py file with the correct credentials
                try:
                    with open('vehicle_test.py', 'r') as file:
                        content = file.read()
                    
                    updated_content = content.replace(
                        'ADMIN_USER = {', 
                        f'ADMIN_USER = {{\n    "username": "{username}",\n    "password": "{password}"  # Valid admin credentials'
                    )
                    
                    with open('vehicle_test.py', 'w') as file:
                        file.write(updated_content)
                    
                    print(f"\n{Colors.OKGREEN}✓ Updated vehicle_test.py with valid credentials{Colors.ENDC}")
                except Exception as e:
                    print(f"\n{Colors.FAIL}✗ Failed to update vehicle_test.py: {str(e)}{Colors.ENDC}")
                
                # Break out of the loop after finding valid credentials
                break
        
        if found:
            break
    
    if not found:
        print(f"\n{Colors.FAIL}No valid admin credentials found.{Colors.ENDC}")
        print(f"{Colors.WARNING}You may need to check if the backend is running or try additional credentials.{Colors.ENDC}")
    
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

if __name__ == "__main__":
    find_admin_credentials() 