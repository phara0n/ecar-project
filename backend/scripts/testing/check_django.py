#!/usr/bin/env python
"""
Django Configuration Check Script
--------------------------------
This script checks if the Django application is configured correctly
and tests specific API endpoints.
"""

import os
import sys
import requests
from pprint import pprint

def check_api_endpoint(url, method="GET", data=None, headers=None):
    """Check if an API endpoint is working correctly."""
    print(f"\n--- Testing {method} {url} ---")
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers)
        else:
            print(f"Unsupported method: {method}")
            return None
        
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type', 'Unknown')}")
        
        try:
            if 'application/json' in response.headers.get('Content-Type', ''):
                response_data = response.json()
                print("Response Data:")
                pprint(response_data)
            else:
                print(f"Response Text Preview: {response.text[:250]}...")
        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Raw response: {response.text[:250]}...")
        
        return response
    
    except Exception as e:
        print(f"Error calling {url}: {e}")
        return None

def main():
    """Main function to check Django configuration."""
    base_url = "http://backend:8000"
    
    print("\n=== Django Configuration Check ===\n")
    
    # Check if the Django application is running
    check_api_endpoint(f"{base_url}")
    
    # Check if the API root is accessible
    check_api_endpoint(f"{base_url}/api/")
    
    # Check if the admin site is accessible
    check_api_endpoint(f"{base_url}/admin/")
    
    # Check if the token endpoint is accessible
    auth_data = {
        "username": "admin",
        "password": "admin123"
    }
    check_api_endpoint(f"{base_url}/api/token/", method="POST", data=auth_data)
    
    # Check content types accepted by token endpoint
    headers = {"Content-Type": "application/json"}
    check_api_endpoint(
        f"{base_url}/api/token/", 
        method="POST", 
        data=auth_data, 
        headers=headers
    )
    
    # Try with form data format
    form_headers = {"Content-Type": "application/x-www-form-urlencoded"}
    form_data = {"username": "admin", "password": "admin123"}
    response = requests.post(
        f"{base_url}/api/token/", 
        data=form_data, 
        headers=form_headers
    )
    print(f"\n--- Testing POST {base_url}/api/token/ with form data ---")
    print(f"Status Code: {response.status_code}")
    print(f"Content Type: {response.headers.get('Content-Type', 'Unknown')}")
    print(f"Response Text Preview: {response.text[:250]}...")
    
    print("\n=== Check Complete ===")

if __name__ == "__main__":
    main() 