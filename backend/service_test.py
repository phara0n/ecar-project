#!/usr/bin/env python3
"""
ECAR API Service Management Testing Script
This script tests the service and invoice management endpoints for the ECAR API.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import random

# Configuration
BASE_URL = "http://localhost:8000/api"
AUTH_ENDPOINT = "/auth/token/"
ENDPOINTS = {
    "customers": "/customers/",
    "cars": "/cars/",
    "services": "/services/",
    "service_items": "/service-items/",
    "invoices": "/invoices/"
}

# Test admin user (should be replaced with valid credentials)
ADMIN_USER = {
    "username": "admin",
    "password": "Phara0n$"  # Valid admin credentials
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
    
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}\n")
    
    return response.json() if response.status_code < 400 else None

def get_auth_token(username=None, password=None):
    """Get authentication token"""
    username = username or ADMIN_USER["username"]
    password = password or ADMIN_USER["password"]
    
    print(f"{Colors.HEADER}Getting Authentication Token for {username}...{Colors.ENDC}")
    
    login_data = {
        "username": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}{AUTH_ENDPOINT}", json=login_data)
    tokens = print_response(response, "Authentication")
    
    if response.status_code == 200 and tokens and "access" in tokens:
        print(f"{Colors.OKGREEN}✓ Authentication successful{Colors.ENDC}")
        return tokens["access"]
    else:
        print(f"{Colors.FAIL}✗ Authentication failed{Colors.ENDC}")
        return None

def get_customers(access_token):
    """Get list of customers"""
    print(f"{Colors.HEADER}Getting Customers List...{Colors.ENDC}")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}{ENDPOINTS['customers']}", headers=headers)
    customers = print_response(response, "Get Customers")
    
    if response.status_code == 200 and customers and "results" in customers:
        print(f"{Colors.OKGREEN}✓ Got {len(customers['results'])} customers{Colors.ENDC}")
        return customers["results"]
    else:
        print(f"{Colors.FAIL}✗ Failed to get customers{Colors.ENDC}")
        return []

def get_cars(access_token, customer_id=None):
    """Get list of cars, optionally filtered by customer"""
    if customer_id:
        print(f"{Colors.HEADER}Getting Cars for Customer #{customer_id}...{Colors.ENDC}")
        endpoint = f"{ENDPOINTS['customers']}{customer_id}/cars/"
    else:
        print(f"{Colors.HEADER}Getting All Cars...{Colors.ENDC}")
        endpoint = ENDPOINTS['cars']
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    cars = print_response(response, "Get Cars")
    
    if response.status_code == 200:
        if isinstance(cars, dict) and "results" in cars:
            car_list = cars["results"]
            print(f"{Colors.OKGREEN}✓ Got {len(car_list)} cars{Colors.ENDC}")
            return car_list
        elif isinstance(cars, list):
            print(f"{Colors.OKGREEN}✓ Got {len(cars)} cars{Colors.ENDC}")
            return cars
        else:
            print(f"{Colors.WARNING}⚠ Unexpected response structure{Colors.ENDC}")
            return []
    else:
        print(f"{Colors.FAIL}✗ Failed to get cars{Colors.ENDC}")
        return []

def create_service(car_id, access_token):
    """Create a new service for a car"""
    print(f"{Colors.HEADER}Creating New Service for Car #{car_id}...{Colors.ENDC}")
    
    # Schedule date (today) and description
    scheduled_date = datetime.now().strftime("%Y-%m-%d")
    
    service_data = {
        "car_id": car_id,
        "title": "Maintenance Service",
        "description": "Regular maintenance service including oil change and inspection",
        "status": "scheduled",
        "scheduled_date": scheduled_date
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(
        f"{BASE_URL}{ENDPOINTS['services']}", 
        json=service_data,
        headers=headers
    )
    result = print_response(response, "Create Service")
    
    if response.status_code in [200, 201] and result:
        print(f"{Colors.OKGREEN}✓ Service created successfully (ID: {result['id']}){Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to create service{Colors.ENDC}")
        return None

def add_service_items(service_id, access_token):
    """Add items to a service"""
    print(f"{Colors.HEADER}Adding Items to Service #{service_id}...{Colors.ENDC}")
    
    # Define a few service items to add
    service_items = [
        {
            "service": service_id,
            "name": "Oil Change",
            "description": "Full synthetic oil change",
            "quantity": 1,
            "unit_price": 50.00,
            "item_type": "part"
        },
        {
            "service": service_id,
            "name": "Oil Filter",
            "description": "Replace oil filter",
            "quantity": 1,
            "unit_price": 15.00,
            "item_type": "part"
        },
        {
            "service": service_id,
            "name": "Air Filter",
            "description": "Replace air filter",
            "quantity": 1,
            "unit_price": 25.00,
            "item_type": "part"
        },
        {
            "service": service_id,
            "name": "Labor",
            "description": "Service labor",
            "quantity": 2,  # Changed to integer
            "unit_price": 40.00,
            "item_type": "labor"
        }
    ]
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    added_items = []
    
    for item in service_items:
        response = requests.post(
            f"{BASE_URL}{ENDPOINTS['service_items']}", 
            json=item,
            headers=headers
        )
        result = print_response(response, f"Add Service Item: {item['name']}")
        
        if response.status_code in [200, 201] and result:
            print(f"{Colors.OKGREEN}✓ Service item '{item['name']}' added successfully{Colors.ENDC}")
            added_items.append(result)
        else:
            print(f"{Colors.FAIL}✗ Failed to add service item '{item['name']}'{Colors.ENDC}")
    
    return added_items

def update_service_status(service_id, new_status, access_token):
    """Update a service's status"""
    print(f"{Colors.HEADER}Updating Status for Service #{service_id} to '{new_status}'...{Colors.ENDC}")
    
    status_data = {
        "status": new_status
    }
    
    if new_status == "completed":
        status_data["completed_date"] = datetime.now().strftime("%Y-%m-%d")
        status_data["technician_notes"] = "Service completed successfully. All items checked and replaced as needed."
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.patch(
        f"{BASE_URL}{ENDPOINTS['services']}{service_id}/", 
        json=status_data,
        headers=headers
    )
    result = print_response(response, "Update Service Status")
    
    if response.status_code == 200 and result:
        print(f"{Colors.OKGREEN}✓ Service status updated successfully to '{new_status}'{Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to update service status{Colors.ENDC}")
        return None

def generate_invoice(service_id, access_token):
    """Generate an invoice for a completed service"""
    print(f"{Colors.HEADER}Generating Invoice for Service #{service_id}...{Colors.ENDC}")
    
    # Today's date for the invoice
    invoice_date = datetime.now().strftime("%Y-%m-%d")
    
    # Set due date to 30 days from now
    due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    
    invoice_data = {
        "service_id": service_id,
        "issued_date": invoice_date,
        "due_date": due_date,
        "status": "pending",
        "notes": "Please pay within 30 days of invoice date."
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(
        f"{BASE_URL}{ENDPOINTS['invoices']}", 
        json=invoice_data,
        headers=headers
    )
    result = print_response(response, "Generate Invoice")
    
    if response.status_code in [200, 201] and result:
        print(f"{Colors.OKGREEN}✓ Invoice generated successfully (ID: {result['id']}){Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to generate invoice{Colors.ENDC}")
        return None

def update_invoice_payment(invoice_id, payment_status, access_token):
    """Update an invoice's payment status"""
    print(f"{Colors.HEADER}Updating Payment Status for Invoice #{invoice_id} to '{payment_status}'...{Colors.ENDC}")
    
    payment_data = {
        "status": payment_status
    }
    
    if payment_status == "paid":
        payment_data["payment_date"] = datetime.now().strftime("%Y-%m-%d")
        payment_data["payment_method"] = "credit_card"
        payment_data["payment_reference"] = f"INV-{invoice_id}-{datetime.now().strftime('%Y%m%d')}"
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.patch(
        f"{BASE_URL}{ENDPOINTS['invoices']}{invoice_id}/", 
        json=payment_data,
        headers=headers
    )
    result = print_response(response, "Update Invoice Payment")
    
    if response.status_code == 200 and result:
        print(f"{Colors.OKGREEN}✓ Invoice payment status updated successfully to '{payment_status}'{Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to update invoice payment status{Colors.ENDC}")
        return None

def get_car_services(car_id, access_token):
    """Get services for a specific car"""
    print(f"{Colors.HEADER}Getting Services for Car #{car_id}...{Colors.ENDC}")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}{ENDPOINTS['cars']}{car_id}/services/", headers=headers)
    services = print_response(response, "Get Car Services")
    
    if response.status_code == 200:
        if isinstance(services, list):
            print(f"{Colors.OKGREEN}✓ Got {len(services)} services for car #{car_id}{Colors.ENDC}")
            return services
        else:
            print(f"{Colors.WARNING}⚠ Unexpected response structure{Colors.ENDC}")
            return []
    else:
        print(f"{Colors.FAIL}✗ Failed to get services for car #{car_id}{Colors.ENDC}")
        return []

def run_service_invoice_tests():
    """Run the service and invoice management tests"""
    print(f"{Colors.BOLD}{Colors.HEADER}Starting ECAR API Service & Invoice Testing{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")
    
    # Step 1: Get authentication token
    access_token = get_auth_token()
    if not access_token:
        print(f"{Colors.FAIL}Authentication failed. Cannot proceed with tests.{Colors.ENDC}")
        return
    
    # Step 2: Get customers list
    customers = get_customers(access_token)
    if not customers:
        print(f"{Colors.FAIL}No customers found. Cannot proceed with tests.{Colors.ENDC}")
        return
    
    # Use the first customer for our tests
    customer_id = customers[0]["id"]
    print(f"{Colors.OKBLUE}Using Customer: {customers[0]['user']['first_name']} {customers[0]['user']['last_name']} (ID: {customer_id}){Colors.ENDC}")
    
    # Step 3: Get cars for this customer
    cars = get_cars(access_token, customer_id)
    if not cars:
        print(f"{Colors.FAIL}No cars found for this customer. Cannot proceed with tests.{Colors.ENDC}")
        return
    
    # Use the first car for our tests
    car_id = cars[0]["id"]
    print(f"{Colors.OKBLUE}Using Car: {cars[0]['make']} {cars[0]['model']} (ID: {car_id}){Colors.ENDC}")
    
    # Step 4: Create a new service for this car
    service = create_service(car_id, access_token)
    if not service:
        print(f"{Colors.FAIL}Failed to create service. Cannot proceed with tests.{Colors.ENDC}")
        return
    
    service_id = service["id"]
    
    # Step 5: Add service items
    service_items = add_service_items(service_id, access_token)
    
    # Step 6: Update service status to in_progress
    updated_service = update_service_status(service_id, "in_progress", access_token)
    
    # Step 7: Update service status to completed
    completed_service = update_service_status(service_id, "completed", access_token)
    
    # Step 8: Generate an invoice for the completed service
    if completed_service and completed_service["status"] == "completed":
        invoice = generate_invoice(service_id, access_token)
        
        # Step 9: Update invoice payment status to paid
        if invoice:
            updated_invoice = update_invoice_payment(invoice["id"], "paid", access_token)
    
    # Step 10: Get all services for this car to verify
    car_services = get_car_services(car_id, access_token)
    
    print(f"{Colors.BOLD}{Colors.HEADER}Service & Invoice Testing Complete{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

if __name__ == "__main__":
    run_service_invoice_tests() 