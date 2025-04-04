#!/usr/bin/env python3
"""
ECAR API Vehicle Management Testing Script
This script tests the vehicle management endpoints for the ECAR API.
"""

import requests
import json
import sys
from datetime import datetime
import random

# Configuration
BASE_URL = "http://localhost:8000/api"
AUTH_ENDPOINT = "/auth/token/"
VEHICLE_ENDPOINTS = {
    "cars": "/cars/",
    "customers": "/customers/",
    "mileage_updates": "/mileage-updates/",
    "service_intervals": "/service-intervals/"
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
    
    response = requests.get(f"{BASE_URL}{VEHICLE_ENDPOINTS['customers']}", headers=headers)
    customers = print_response(response, "Get Customers")
    
    if response.status_code == 200 and customers and "results" in customers:
        print(f"{Colors.OKGREEN}✓ Got {len(customers['results'])} customers{Colors.ENDC}")
        return customers["results"]
    else:
        print(f"{Colors.FAIL}✗ Failed to get customers{Colors.ENDC}")
        return []

def create_vehicle(customer_id, access_token):
    """Create a new vehicle for a customer"""
    print(f"{Colors.HEADER}Creating New Vehicle for Customer #{customer_id}...{Colors.ENDC}")
    
    # Generate random license plate in valid format (xxxTUxxxx)
    digits_prefix = ''.join([str(random.randint(0, 9)) for _ in range(3)])
    digits_suffix = ''.join([str(random.randint(0, 9)) for _ in range(random.randint(1, 4))])
    license_plate = f"{digits_prefix}TU{digits_suffix}"
    
    # Random VIN (simplified)
    vin = ''.join([random.choice("0123456789ABCDEFGHJKLMNPRSTUVWXYZ") for _ in range(17)])
    
    vehicle_data = {
        "customer_id": customer_id,
        "make": random.choice(["Toyota", "Hyundai", "Kia", "Peugeot", "Renault"]),
        "model": random.choice(["Corolla", "i30", "Sportage", "208", "Clio"]),
        "year": random.randint(2010, 2023),
        "license_plate": license_plate,
        "vin": vin,
        "fuel_type": random.choice(["gasoline", "diesel", "electric", "hybrid"]),
        "mileage": random.randint(1000, 50000)
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(
        f"{BASE_URL}{VEHICLE_ENDPOINTS['cars']}", 
        json=vehicle_data,
        headers=headers
    )
    result = print_response(response, "Create Vehicle")
    
    if response.status_code in [200, 201] and result:
        print(f"{Colors.OKGREEN}✓ Vehicle created successfully: {result['make']} {result['model']} ({result['license_plate']}){Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to create vehicle{Colors.ENDC}")
        return None

def get_vehicles(access_token, customer_id=None):
    """Get list of vehicles, optionally filtered by customer"""
    if customer_id:
        print(f"{Colors.HEADER}Getting Vehicles for Customer #{customer_id}...{Colors.ENDC}")
        endpoint = f"{VEHICLE_ENDPOINTS['customers']}{customer_id}/cars/"
    else:
        print(f"{Colors.HEADER}Getting All Vehicles...{Colors.ENDC}")
        endpoint = VEHICLE_ENDPOINTS['cars']
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    vehicles = print_response(response, "Get Vehicles")
    
    if response.status_code == 200:
        if isinstance(vehicles, dict) and "results" in vehicles:
            vehicle_list = vehicles["results"]
            print(f"{Colors.OKGREEN}✓ Got {len(vehicle_list)} vehicles{Colors.ENDC}")
            return vehicle_list
        elif isinstance(vehicles, list):
            print(f"{Colors.OKGREEN}✓ Got {len(vehicles)} vehicles{Colors.ENDC}")
            return vehicles
        else:
            print(f"{Colors.WARNING}⚠ Unexpected response structure{Colors.ENDC}")
            return []
    else:
        print(f"{Colors.FAIL}✗ Failed to get vehicles{Colors.ENDC}")
        return []

def update_vehicle_mileage(vehicle_id, new_mileage, access_token):
    """Update a vehicle's mileage"""
    print(f"{Colors.HEADER}Updating Mileage for Vehicle #{vehicle_id} to {new_mileage}...{Colors.ENDC}")
    
    mileage_data = {
        "mileage": new_mileage
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.patch(
        f"{BASE_URL}{VEHICLE_ENDPOINTS['cars']}{vehicle_id}/", 
        json=mileage_data,
        headers=headers
    )
    result = print_response(response, "Update Vehicle Mileage")
    
    if response.status_code == 200 and result:
        print(f"{Colors.OKGREEN}✓ Mileage updated successfully to {result['mileage']}{Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to update mileage{Colors.ENDC}")
        return None

def create_mileage_update(vehicle_id, mileage, access_token):
    """Create a mileage update record"""
    print(f"{Colors.HEADER}Creating Mileage Update Record for Vehicle #{vehicle_id}...{Colors.ENDC}")
    
    # Current date
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    mileage_update_data = {
        "car": vehicle_id,
        "mileage": mileage,
        "reported_date": current_date,
        "notes": "Mileage update from testing script"
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.post(
        f"{BASE_URL}{VEHICLE_ENDPOINTS['mileage_updates']}", 
        json=mileage_update_data,
        headers=headers
    )
    result = print_response(response, "Create Mileage Update")
    
    if response.status_code in [200, 201] and result:
        print(f"{Colors.OKGREEN}✓ Mileage update created successfully{Colors.ENDC}")
        return result
    else:
        print(f"{Colors.FAIL}✗ Failed to create mileage update{Colors.ENDC}")
        return None

def get_service_intervals(access_token):
    """Get list of service intervals"""
    print(f"{Colors.HEADER}Getting Service Intervals...{Colors.ENDC}")
    
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}{VEHICLE_ENDPOINTS['service_intervals']}", headers=headers)
    service_intervals = print_response(response, "Get Service Intervals")
    
    if response.status_code == 200 and service_intervals and "results" in service_intervals:
        print(f"{Colors.OKGREEN}✓ Got {len(service_intervals['results'])} service intervals{Colors.ENDC}")
        return service_intervals["results"]
    else:
        print(f"{Colors.FAIL}✗ Failed to get service intervals{Colors.ENDC}")
        return []

def run_vehicle_tests():
    """Run the vehicle management tests"""
    print(f"{Colors.BOLD}{Colors.HEADER}Starting ECAR API Vehicle Management Testing{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")
    
    # Step 1: Get authentication token
    access_token = get_auth_token()
    if not access_token:
        print(f"{Colors.FAIL}Authentication failed. Cannot proceed with tests.{Colors.ENDC}")
        return
    
    # Step 2: Get customers list
    customers = get_customers(access_token)
    if not customers:
        print(f"{Colors.FAIL}No customers found. Cannot proceed with vehicle tests.{Colors.ENDC}")
        return
    
    # Use the first customer for our tests
    customer_id = customers[0]["id"]
    print(f"{Colors.OKBLUE}Using Customer: {customers[0]['user']['first_name']} {customers[0]['user']['last_name']} (ID: {customer_id}){Colors.ENDC}")
    
    # Step 3: Get existing vehicles for this customer
    existing_vehicles = get_vehicles(access_token, customer_id)
    
    vehicle_to_update = None
    
    # Step 4: Create a new vehicle if no vehicles exist
    if not existing_vehicles:
        print(f"{Colors.WARNING}No existing vehicles found for this customer. Creating a new one...{Colors.ENDC}")
        vehicle = create_vehicle(customer_id, access_token)
        if vehicle:
            vehicle_to_update = vehicle
    else:
        # Use the first existing vehicle
        vehicle_to_update = existing_vehicles[0]
        print(f"{Colors.OKBLUE}Using existing vehicle: {vehicle_to_update['make']} {vehicle_to_update['model']} (ID: {vehicle_to_update['id']}){Colors.ENDC}")
    
    if not vehicle_to_update:
        print(f"{Colors.FAIL}No vehicle available for testing. Test suite cannot proceed.{Colors.ENDC}")
        return
    
    # Step 5: Update vehicle mileage
    current_mileage = vehicle_to_update["mileage"]
    new_mileage = current_mileage + random.randint(1000, 5000)
    updated_vehicle = update_vehicle_mileage(vehicle_to_update["id"], new_mileage, access_token)
    
    # Step 6: Create a mileage update record
    if updated_vehicle:
        mileage_update = create_mileage_update(updated_vehicle["id"], updated_vehicle["mileage"], access_token)
    
    # Step 7: Get service intervals
    service_intervals = get_service_intervals(access_token)
    
    print(f"{Colors.BOLD}{Colors.HEADER}Vehicle Management Testing Complete{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*80}{Colors.ENDC}")

if __name__ == "__main__":
    run_vehicle_tests() 