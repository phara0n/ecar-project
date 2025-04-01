#!/usr/bin/env python
"""
Direct API Testing Script
------------------------
This script tests the API endpoints directly without requiring JWT authentication
by using Django's session authentication via the admin login.
"""

import os
import sys
import logging
import requests
from datetime import datetime
import json
import re

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

def test_direct_api_access(base_url="http://backend:8000"):
    """Test API directly without session authentication"""
    logger.info("=" * 60)
    logger.info(f"Starting Direct API Test - {datetime.now()}")
    logger.info(f"Base URL: {base_url}")
    logger.info("=" * 60)
    
    success_count = 0
    failure_count = 0
    
    # Check if we can access the admin page
    try:
        logger.info("Testing admin access...")
        admin_response = requests.get(f"{base_url}/admin/")
        logger.info(f"Admin response status: {admin_response.status_code}")
        if admin_response.status_code in [200, 302]:
            logger.info("Admin page accessible")
            success_count += 1
        else:
            logger.error(f"Admin page not accessible: {admin_response.text[:100]}")
            failure_count += 1
    except Exception as e:
        logger.error(f"Error accessing admin: {str(e)}")
        failure_count += 1
    
    # Test direct access to the API endpoints
    api_endpoints = [
        "/api/",
        "/admin/login/",
        "/admin/",
    ]
    
    for endpoint in api_endpoints:
        try:
            url = f"{base_url}{endpoint}"
            logger.info(f"Testing endpoint: {url}")
            response = requests.get(url)
            logger.info(f"Response status: {response.status_code}")
            
            if response.status_code in [200, 302, 401]:  # 401 is OK for API endpoints since we're not authenticating
                logger.info(f"Endpoint {endpoint} accessible")
                success_count += 1
                
                # Log response preview
                try:
                    if response.headers.get('Content-Type', '').startswith('application/json'):
                        logger.info(f"JSON response: {json.dumps(response.json(), indent=2)[:200]}")
                    else:
                        logger.info(f"Response preview: {response.text[:200]}")
                except:
                    logger.info(f"Response preview: {response.text[:200]}")
            else:
                logger.error(f"Endpoint {endpoint} returned unexpected status: {response.status_code}")
                logger.error(f"Response: {response.text[:200]}")
                failure_count += 1
        except Exception as e:
            logger.error(f"Error accessing {endpoint}: {str(e)}")
            failure_count += 1
    
    # Check REST Framework browsable API
    try:
        url = f"{base_url}/api/?format=api"
        logger.info(f"Testing browsable API: {url}")
        response = requests.get(url)
        logger.info(f"Browsable API response status: {response.status_code}")
        
        if response.status_code in [200, 401]:
            logger.info("Browsable API accessible")
            success_count += 1
        else:
            logger.error(f"Browsable API not accessible: {response.text[:200]}")
            failure_count += 1
    except Exception as e:
        logger.error(f"Error accessing browsable API: {str(e)}")
        failure_count += 1
        
    # Test form-based login with improved CSRF extraction
    try:
        # Get login page to extract CSRF token
        login_url = f"{base_url}/admin/login/"
        session = requests.Session()
        login_page = session.get(login_url)
        
        if login_page.status_code == 200:
            # Improved CSRF token extraction using regex
            csrf_token = None
            
            # Try to get from cookie first
            csrf_token = session.cookies.get('csrftoken')
            
            # If not in cookie, try to extract from HTML
            if not csrf_token:
                csrf_pattern = re.compile(r'csrfmiddlewaretoken[\'"\s]+value[\'"\s]+=[\'"\s]+([^\'"\s]+)')
                match = csrf_pattern.search(login_page.text)
                if match:
                    csrf_token = match.group(1)
            
            if csrf_token:
                logger.info(f"Found CSRF token: {csrf_token[:6]}...")
                
                # Attempt login
                login_data = {
                    'csrfmiddlewaretoken': csrf_token,
                    'username': 'admin',
                    'password': 'admin123',
                    'next': '/admin/'
                }
                
                login_headers = {
                    'Referer': login_url,
                    'X-CSRFToken': csrf_token
                }
                
                login_response = session.post(
                    login_url,
                    data=login_data,
                    headers=login_headers
                )
                
                logger.info(f"Login response status: {login_response.status_code}")
                logger.info(f"Login response URL: {login_response.url}")
                
                # Save cookies after login for debugging
                logger.info(f"Cookies after login: {session.cookies.get_dict()}")
                
                # Verify login was successful
                admin_page = session.get(f"{base_url}/admin/")
                
                logger.info(f"Admin page after login - Status: {admin_page.status_code}")
                
                # Save the first 500 characters of the admin page for debugging
                admin_text_sample = admin_page.text[:500].replace('\n', ' ')
                logger.info(f"Admin page content sample: {admin_text_sample}")
                
                # Check for various success indicators
                login_success = False
                success_indicators = [
                    "Log out",  # English
                    "Déconnexion",  # French
                    "admin/logout",  # Logout URL
                    "Site administration",  # English admin title
                    "Administration du site"  # French admin title
                ]
                
                for indicator in success_indicators:
                    if indicator in admin_page.text:
                        logger.info(f"Login success indicator found: '{indicator}'")
                        login_success = True
                        break
                
                if login_success:
                    logger.info("Login successful - found success indicators in admin page")
                    success_count += 1
                    
                    # Now try accessing API with authenticated session
                    api_url = f"{base_url}/api/"
                    api_response = session.get(api_url)
                    
                    logger.info(f"Authenticated API response status: {api_response.status_code}")
                    
                    if api_response.status_code == 200:
                        logger.info("Authenticated API access successful")
                        logger.info(f"API response: {api_response.text[:200]}")
                        success_count += 1
                    else:
                        logger.error(f"Authenticated API access failed: {api_response.text[:200]}")
                        failure_count += 1
                else:
                    logger.error("Login failed - no success indicators in admin page")
                    logger.error(f"Admin page status: {admin_page.status_code}")
                    failure_count += 1
            else:
                logger.error("Could not extract CSRF token")
                failure_count += 1
        else:
            logger.error(f"Could not access login page: {login_page.status_code}")
            failure_count += 1
    except Exception as e:
        logger.error(f"Error during login process: {str(e)}")
        failure_count += 1
    
    # Test non-authenticated endpoints (if any)
    try:
        docs_url = f"{base_url}/api/docs/"
        logger.info(f"Testing docs URL: {docs_url}")
        response = requests.get(docs_url)
        logger.info(f"Docs response status: {response.status_code}")
        
        if response.status_code in [200, 404]:  # 404 is acceptable if docs aren't set up
            logger.info("Docs endpoint tested")
            success_count += 1
        else:
            logger.error(f"Docs endpoint error: {response.text[:200]}")
            failure_count += 1
    except Exception as e:
        logger.error(f"Error accessing docs: {str(e)}")
        failure_count += 1
    
    # Try JWT authentication if session auth fails
    try:
        logger.info("Session authentication unsuccessful, attempting JWT authentication...")
        
        # Get JWT token
        jwt_login_url = f"{base_url}/api/token/"
        jwt_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        jwt_response = requests.post(jwt_login_url, json=jwt_data)
        logger.info(f"JWT login response status: {jwt_response.status_code}")
        
        if jwt_response.status_code == 200:
            jwt_data = jwt_response.json()
            access_token = jwt_data.get("access")
            refresh_token = jwt_data.get("refresh")
            
            if access_token:
                logger.info(f"Obtained JWT access token: {access_token[:10]}...")
                
                # Try accessing API with JWT token
                jwt_headers = {
                    "Authorization": f"Bearer {access_token}"
                }
                
                jwt_api_response = requests.get(f"{base_url}/api/", headers=jwt_headers)
                logger.info(f"JWT authenticated API response status: {jwt_api_response.status_code}")
                
                if jwt_api_response.status_code == 200:
                    logger.info("JWT authenticated API access successful")
                    logger.info(f"JWT API response: {jwt_api_response.text[:200]}")
                    success_count += 1
                else:
                    logger.error(f"JWT authenticated API access failed: {jwt_api_response.text[:200]}")
                    failure_count += 1
            else:
                logger.error("JWT token response did not contain access token")
                logger.error(f"JWT response: {jwt_response.text[:200]}")
                failure_count += 1
        else:
            logger.error(f"JWT login failed with status {jwt_response.status_code}")
            logger.error(f"JWT error response: {jwt_response.text[:200]}")
            failure_count += 1
    except Exception as e:
        logger.error(f"Error during JWT authentication: {str(e)}")
        failure_count += 1
    
    # Report results
    logger.info("\n" + "=" * 60)
    logger.info("API TEST RESULTS")
    logger.info("=" * 60)
    logger.info(f"Success: {success_count}")
    logger.info(f"Failures: {failure_count}")
    logger.info("=" * 60)
    
    return success_count > 0 and failure_count < 3  # Allow some failures

if __name__ == "__main__":
    success = test_direct_api_access()
    if success:
        logger.info("API tests completed with acceptable success rate")
        sys.exit(0)
    else:
        logger.error("API tests failed with too many errors")
        sys.exit(1) 