#!/usr/bin/env python
"""
Simplified API Testing Script
----------------------------
This script tests the API using Django's cookie-based authentication
instead of relying on JWT tokens.
"""

import os
import sys
import logging
import requests
from datetime import datetime

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecar_backend.settings')

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("api_test_results.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def test_api(base_url="http://backend:8000"):
    """Run API tests with cookie-based authentication."""
    logger.info("=" * 60)
    logger.info(f"Starting ECAR API Test - {datetime.now()}")
    logger.info(f"Base URL: {base_url}")
    logger.info("=" * 60)
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # Test direct API access without authentication (should fail)
    try:
        logger.info("Testing unauthenticated API access...")
        api_response = session.get(f"{base_url}/api/")
        logger.info(f"Unauthenticated API response: {api_response.status_code}")
        logger.info(f"Response: {api_response.text[:200]}")
    except Exception as e:
        logger.error(f"Error testing unauthenticated API: {str(e)}")
    
    # Step 1: Get the CSRF token from the login page
    try:
        logger.info("Fetching admin login page for CSRF token...")
        login_page = session.get(f"{base_url}/admin/login/")
        logger.info(f"Login page response: {login_page.status_code}")
        
        # Check if we got a valid response
        if login_page.status_code != 200:
            logger.error("Failed to load admin login page")
            return False
            
        # Find the CSRF token
        csrf_token = None
        for line in login_page.text.splitlines():
            if 'csrfmiddlewaretoken' in line:
                csrf_token = line.split('value="')[1].split('"')[0]
                break
                
        if not csrf_token:
            logger.error("Failed to find CSRF token")
            return False
            
        logger.info(f"Found CSRF token: {csrf_token[:10]}...")
        
        # Step 2: Log in to Django admin
        login_data = {
            'csrfmiddlewaretoken': csrf_token,
            'username': 'admin',
            'password': 'admin123',
            'next': '/admin/'
        }
        
        logger.info("Logging in to Django admin...")
        login_response = session.post(
            f"{base_url}/admin/login/", 
            data=login_data,
            headers={'Referer': f"{base_url}/admin/login/"}
        )
        
        logger.info(f"Login response: {login_response.status_code}")
        logger.info(f"Login response URL: {login_response.url}")
        
        if login_response.status_code != 200 and login_response.status_code != 302:
            logger.error("Login failed")
            return False
            
        # Step 3: Check if we're logged in
        logger.info("Verifying login by accessing admin page...")
        admin_page = session.get(f"{base_url}/admin/")
        
        if "Log out" not in admin_page.text:
            logger.error("Login validation failed - not logged in")
            return False
            
        logger.info("Successfully logged in to Django admin")
        
        # Step 4: Try accessing the API with the authenticated session
        logger.info("Testing authenticated API access...")
        api_response = session.get(f"{base_url}/api/")
        logger.info(f"API response: {api_response.status_code}")
        
        if api_response.status_code == 200:
            logger.info("API access successful")
            logger.info(f"API endpoints: {api_response.text[:200]}...")
            
            # Step 5: Test specific endpoints
            try:
                # Test customers endpoint
                customers_response = session.get(f"{base_url}/api/customers/")
                logger.info(f"Customers API response: {customers_response.status_code}")
                if customers_response.status_code == 200:
                    logger.info("Customers API access successful")
                else:
                    logger.warning(f"Customers API access failed: {customers_response.text[:100]}")
                
                # Test cars endpoint
                cars_response = session.get(f"{base_url}/api/cars/")
                logger.info(f"Cars API response: {cars_response.status_code}")
                if cars_response.status_code == 200:
                    logger.info("Cars API access successful")
                else:
                    logger.warning(f"Cars API access failed: {cars_response.text[:100]}")
                    
            except Exception as e:
                logger.error(f"Error testing specific endpoints: {str(e)}")
            
            return True
        else:
            logger.error(f"API access failed: {api_response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error testing API: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_api()
    if success:
        logger.info("API tests completed successfully")
        sys.exit(0)
    else:
        logger.error("API tests failed")
        sys.exit(1) 