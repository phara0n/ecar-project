#!/usr/bin/env python
"""
ECAR API Testing Script
------------------------
This script performs a series of tests on all API endpoints to verify their functionality.
It starts with authentication, tests each endpoint category, and reports any issues found.

Usage:
    python api_test.py [--base-url=http://localhost:8000] [--username=admin] [--password=admin123]
"""

import requests
import argparse
import sys
import json
import logging
from datetime import datetime, timedelta

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

class EcarApiTester:
    """Test suite for ECAR API endpoints."""
    
    def __init__(self, base_url="http://localhost:8000", username="admin", password="admin123"):
        self.base_url = base_url
        self.username = username
        self.password = password
        self.access_token = None
        self.refresh_token = None
        self.headers = {}
        
        # Test results tracking
        self.success_count = 0
        self.failure_count = 0
        self.skipped_count = 0
        self.total_tests = 0
        
        # Resources created during testing (for cleanup)
        self.test_resources = {
            "customers": [],
            "cars": [],
            "services": [],
            "invoices": []
        }
    
    def run_all_tests(self):
        """Run all API endpoint tests."""
        logger.info("=" * 60)
        logger.info(f"Starting ECAR API Test Suite - {datetime.now()}")
        logger.info(f"Base URL: {self.base_url}")
        logger.info("=" * 60)
        
        # Authenticate first
        if not self.test_authentication():
            logger.error("Authentication failed. Cannot proceed with other tests.")
            return False
        
        # Set authentication header for all subsequent requests
        self.headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # Run all test categories
        self.test_customer_endpoints()
        self.test_car_endpoints()
        self.test_service_endpoints()
        self.test_invoice_endpoints()
        self.test_token_refresh()
        self.test_token_blacklist()
        
        # Report results
        self.report_results()
        
        return self.failure_count == 0
    
    def report_results(self):
        """Report test results."""
        logger.info("\n" + "=" * 60)
        logger.info("ECAR API TEST RESULTS")
        logger.info("=" * 60)
        logger.info(f"Total Tests:    {self.total_tests}")
        logger.info(f"Successful:     {self.success_count}")
        logger.info(f"Failed:         {self.failure_count}")
        logger.info(f"Skipped:        {self.skipped_count}")
        logger.info(f"Success Rate:   {(self.success_count / self.total_tests) * 100:.2f}%")
        logger.info("=" * 60)
    
    def test_request(self, method, endpoint, data=None, files=None, expected_status=200, json_data=True, auth_required=True):
        """Make a test request and log the result."""
        self.total_tests += 1
        url = f"{self.base_url}/api/{endpoint}"
        
        headers = self.headers.copy() if auth_required else {}
        if json_data and data:
            headers["Content-Type"] = "application/json"
            data = json.dumps(data)
        
        try:
            if method.lower() == "get":
                response = requests.get(url, headers=headers)
            elif method.lower() == "post":
                if files:
                    # For multipart/form-data
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, data=data, headers=headers)
            elif method.lower() == "put":
                response = requests.put(url, data=data, headers=headers)
            elif method.lower() == "patch":
                response = requests.patch(url, data=data, headers=headers)
            elif method.lower() == "delete":
                response = requests.delete(url, headers=headers)
            else:
                logger.error(f"Unsupported method: {method}")
                self.failure_count += 1
                return None
            
            success = response.status_code == expected_status
            
            if success:
                logger.info(f"✅ {method.upper()} {url} - {response.status_code}")
                self.success_count += 1
            else:
                logger.error(f"❌ {method.upper()} {url} - Expected {expected_status}, got {response.status_code}")
                logger.error(f"Response: {response.text}")
                self.failure_count += 1
            
            return response
            
        except Exception as e:
            logger.error(f"❌ {method.upper()} {url} - Exception: {str(e)}")
            self.failure_count += 1
            return None
    
    def test_authentication(self):
        """Test authentication endpoints."""
        logger.info("\n----- Testing Authentication -----")
        
        # Test token endpoint with JSON format
        auth_data = {
            "username": self.username,
            "password": self.password
        }
        
        logger.info(f"Attempting authentication with different API paths...")
        
        # Try different URL patterns for the token endpoint
        token_urls = [
            f"{self.base_url}/api/token/",
            f"{self.base_url}/token/",
            f"{self.base_url}/api/auth/token/",
            f"{self.base_url}/auth/token/"
        ]
        
        # First try with application/json content type
        response = None
        success = False
        
        for url in token_urls:
            try:
                logger.info(f"Trying JSON authentication at {url}...")
                headers = {"Content-Type": "application/json"}
                response = requests.post(url, json=auth_data, headers=headers)
                logger.info(f"JSON auth response status: {response.status_code}")
                logger.info(f"JSON auth response content: {response.text[:100]}...")
                
                if response.status_code == 200:
                    logger.info(f"Successfully authenticated with JSON at {url}")
                    self.success_count += 1
                    success = True
                    break
            except Exception as e:
                logger.error(f"JSON authentication request failed at {url}: {str(e)}")
        
        # If JSON authentication fails, try with form data
        if not success:
            for url in token_urls:
                try:
                    logger.info(f"Trying form authentication at {url}...")
                    form_data = {
                        "username": self.username,
                        "password": self.password
                    }
                    headers = {"Content-Type": "application/x-www-form-urlencoded"}
                    response = requests.post(url, data=form_data, headers=headers)
                    logger.info(f"Form auth response status: {response.status_code}")
                    logger.info(f"Form auth response content: {response.text[:100]}...")
                    
                    if response.status_code == 200:
                        logger.info(f"Successfully authenticated with form data at {url}")
                        self.success_count += 1
                        success = True
                        break
                except Exception as e:
                    logger.error(f"Form authentication request failed at {url}: {str(e)}")
        
        if not success:
            logger.error("Authentication failed with all URL patterns. Check API structure and credentials.")
            if response:
                logger.error(f"Last response status: {response.status_code}")
                logger.error(f"Last response content: {response.text}")
            return False
        
        # Extract tokens
        try:
            token_data = response.json()
            logger.info(f"Token data keys: {list(token_data.keys())}")
            
            # Try different potential key names for tokens
            self.access_token = token_data.get("access") or token_data.get("access_token") or token_data.get("token")
            self.refresh_token = token_data.get("refresh") or token_data.get("refresh_token")
            
            if not self.access_token:
                logger.error(f"Failed to extract access token from response: {token_data}")
                return False
            
            logger.info("Successfully obtained authentication token")
            
            # If we don't have a refresh token but have access token, consider it a success
            if not self.refresh_token:
                logger.warning("No refresh token found, but continuing with access token only")
                
            # Test token validity with different URL patterns
            token_test_urls = [
                f"{self.base_url}/api/token/test/",
                f"{self.base_url}/api/token/verify/",
                f"{self.base_url}/api/auth/verify/",
                f"{self.base_url}/token/verify/",
                f"{self.base_url}/api/users/me/",  # Common pattern to check current user
                f"{self.base_url}/api/me/"         # Another common pattern
            ]
            
            for test_url in token_test_urls:
                try:
                    logger.info(f"Testing token validity at {test_url}...")
                    headers = {"Authorization": f"Bearer {self.access_token}"}
                    token_test_response = requests.get(test_url, headers=headers)
                    logger.info(f"Token test response: {token_test_response.status_code}")
                    
                    if token_test_response.status_code == 200:
                        logger.info(f"Token validation successful at {test_url}")
                        self.success_count += 1
                        return True
                except Exception as e:
                    logger.warning(f"Token validation request failed at {test_url}: {str(e)}")
            
            # If we have the token but couldn't verify it with any endpoint, 
            # assume it's valid and try to proceed
            logger.warning("Could not find a token verification endpoint, assuming token is valid")
            return True
                
        except Exception as e:
            logger.error(f"Token parsing error: {str(e)}")
            if response:
                logger.error(f"Response content: {response.text}")
            return False
    
    def test_token_refresh(self):
        """Test token refresh endpoint."""
        logger.info("\n----- Testing Token Refresh -----")
        
        response = self.test_request(
            "post", 
            "token/refresh/", 
            data={"refresh": self.refresh_token}
        )
        
        if response and response.status_code == 200:
            # Update access token
            token_data = response.json()
            self.access_token = token_data.get("access")
            self.headers = {"Authorization": f"Bearer {self.access_token}"}
            return True
        
        return False
    
    def test_token_blacklist(self):
        """Test token blacklist endpoint."""
        logger.info("\n----- Testing Token Blacklist -----")
        
        # First get a new refresh token since we'll be blacklisting it
        response = self.test_request(
            "post", 
            "token/", 
            data={"username": self.username, "password": self.password},
            json_data=False,
            auth_required=False
        )
        
        if response and response.status_code == 200:
            token_data = response.json()
            temp_refresh = token_data.get("refresh")
            
            # Now blacklist the token
            blacklist_response = self.test_request(
                "post", 
                "token/blacklist/", 
                data={"refresh": temp_refresh}
            )
            
            # Try to use the blacklisted token
            verify_response = self.test_request(
                "post", 
                "token/refresh/", 
                data={"refresh": temp_refresh},
                expected_status=401  # Should fail with unauthorized
            )
            
            return blacklist_response and blacklist_response.status_code == 200
        
        return False
    
    def test_customer_endpoints(self):
        """Test customer endpoints."""
        logger.info("\n----- Testing Customer Endpoints -----")
        
        # List customers
        customers = self.test_request("get", "customers/")
        
        # Create a test customer
        test_customer_data = {
            "user": {
                "email": f"test_user_{datetime.now().timestamp()}@ecar.test",
                "first_name": "Test",
                "last_name": "User"
            },
            "phone": "+1234567890",
            "address": "123 Test St, Test City"
        }
        
        created_customer = self.test_request("post", "customers/", data=test_customer_data)
        
        if created_customer and created_customer.status_code == 201:
            customer_id = created_customer.json().get("id")
            self.test_resources["customers"].append(customer_id)
            
            # Test getting a single customer
            self.test_request("get", f"customers/{customer_id}/")
            
            # Test customer statistics
            self.test_request("get", f"customers/{customer_id}/statistics/")
            
            # Test customer service history (will be empty for new customer)
            self.test_request("get", f"customers/{customer_id}/service_history/")
            
            # Test updating customer address
            self.test_request(
                "patch", 
                f"customers/{customer_id}/update_address/", 
                data={"address": "456 New Address St, Test City"}
            )
            
            # Test getting customer's cars (will be empty for new customer)
            self.test_request("get", f"customers/{customer_id}/cars/")
    
    def test_car_endpoints(self):
        """Test car endpoints."""
        logger.info("\n----- Testing Car Endpoints -----")
        
        # Skip if no customers were created
        if not self.test_resources["customers"]:
            logger.warning("Skipping car tests - no test customers available")
            self.skipped_count += 5
            return
        
        # List cars
        cars = self.test_request("get", "cars/")
        
        # Create a test car
        test_car_data = {
            "customer": self.test_resources["customers"][0],
            "make": "Test Make",
            "model": "Test Model",
            "year": 2025,
            "license_plate": f"TEST-{datetime.now().timestamp():.0f}",
            "vin": f"VIN{datetime.now().timestamp():.0f}",
            "fuel_type": "Gasoline",
            "mileage": 1000
        }
        
        created_car = self.test_request("post", "cars/", data=test_car_data)
        
        if created_car and created_car.status_code == 201:
            car_id = created_car.json().get("id")
            self.test_resources["cars"].append(car_id)
            
            # Test getting a single car
            self.test_request("get", f"cars/{car_id}/")
            
            # Test car services (will be empty for new car)
            self.test_request("get", f"cars/{car_id}/services/")
            
            # Test updating car info
            self.test_request(
                "patch", 
                f"cars/{car_id}/", 
                data={"mileage": 1500}
            )
    
    def test_service_endpoints(self):
        """Test service endpoints."""
        logger.info("\n----- Testing Service Endpoints -----")
        
        # Skip if no cars were created
        if not self.test_resources["cars"]:
            logger.warning("Skipping service tests - no test cars available")
            self.skipped_count += 8
            return
        
        # List services
        services = self.test_request("get", "services/")
        
        # Create a test service
        test_service_data = {
            "car": self.test_resources["cars"][0],
            "title": "Test Service",
            "description": "This is a test service",
            "status": "scheduled",
            "scheduled_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        }
        
        created_service = self.test_request("post", "services/", data=test_service_data)
        
        if created_service and created_service.status_code == 201:
            service_id = created_service.json().get("id")
            self.test_resources["services"].append(service_id)
            
            # Test getting a single service
            self.test_request("get", f"services/{service_id}/")
            
            # Test service items (will be empty for new service)
            self.test_request("get", f"services/{service_id}/items/")
            
            # Test completing a service
            self.test_request(
                "post", 
                f"services/{service_id}/complete/", 
                data={"technician_notes": "Service completed during test"}
            )
            
            # Test fetching completed services
            self.test_request("get", "services/completed/")
            
            # Test service statistics
            self.test_request("get", "services/statistics/")
    
    def test_invoice_endpoints(self):
        """Test invoice endpoints."""
        logger.info("\n----- Testing Invoice Endpoints -----")
        
        # Skip if no services were created
        if not self.test_resources["services"]:
            logger.warning("Skipping invoice tests - no test services available")
            self.skipped_count += 7
            return
        
        # List invoices
        invoices = self.test_request("get", "invoices/")
        
        # Create a test invoice
        test_invoice_data = {
            "service": self.test_resources["services"][0],
            "issued_date": datetime.now().strftime("%Y-%m-%d"),
            "due_date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
            "status": "pending",
            "notes": "Test invoice created during API testing",
            "tax_rate": 19.00
        }
        
        created_invoice = self.test_request("post", "invoices/", data=test_invoice_data)
        
        if created_invoice and created_invoice.status_code == 201:
            invoice_id = created_invoice.json().get("id")
            self.test_resources["invoices"].append(invoice_id)
            
            # Test getting a single invoice
            self.test_request("get", f"invoices/{invoice_id}/")
            
            # Test marking invoice as paid
            self.test_request(
                "post", 
                f"invoices/{invoice_id}/mark_as_paid/", 
                data={"payment_notes": "Paid during testing"}
            )
            
            # Test fetching paid invoices
            self.test_request("get", "invoices/paid/")
            
            # Test invoice statistics
            self.test_request("get", "invoices/statistics/")

def main():
    """Main function to run the API tests."""
    parser = argparse.ArgumentParser(description="ECAR API Testing Tool")
    parser.add_argument("--base-url", default="http://localhost:8000", help="Base URL of the API")
    parser.add_argument("--username", default="admin", help="Username for authentication")
    parser.add_argument("--password", default="admin123", help="Password for authentication")
    parser.add_argument("--debug", action="store_true", help="Enable additional debug info")
    
    args = parser.parse_args()
    
    # Print environment information
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Requests version: {requests.__version__}")
    logger.info(f"Testing URL: {args.base_url}")
    
    # Verify API availability before testing
    try:
        logger.info(f"Verifying API availability at {args.base_url}/api/...")
        response = requests.get(f"{args.base_url}/api/", timeout=5)
        logger.info(f"API response status: {response.status_code}")
        logger.info(f"API response: {response.text[:100]}...")
    except Exception as e:
        logger.error(f"API not available: {str(e)}")
        logger.info("Continuing with tests anyway in case the error is temporary...")
    
    # Try to get Django version info
    try:
        if "backend" in args.base_url:
            # Running in Docker - using container hostname
            logger.info("Detected Docker environment (using 'backend' hostname)")
        else:
            logger.info("Running in local environment")
    except Exception as e:
        logger.error(f"Error checking environment: {str(e)}")
    
    tester = EcarApiTester(
        base_url=args.base_url,
        username=args.username,
        password=args.password
    )
    
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main() 