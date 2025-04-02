import json
import requests
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Car


class Command(BaseCommand):
    help = 'Tests the API endpoints for the mileage-based service prediction feature'

    def handle(self, *args, **options):
        # Make sure we have at least one car and a superuser
        try:
            car = Car.objects.first()
            if not car:
                self.stdout.write(self.style.ERROR('No car found. Please run create_test_mileage_data first.'))
                return
            
            superuser = User.objects.filter(is_superuser=True).first()
            if not superuser:
                self.stdout.write(self.style.ERROR('No superuser found. Please run create_test_mileage_data first.'))
                return
                
            # Get JWT token for the superuser
            refresh = RefreshToken.for_user(superuser)
            token = str(refresh.access_token)
            
            self.stdout.write(self.style.SUCCESS(f'Using car: {car.make} {car.model} ({car.license_plate})'))
            self.stdout.write(self.style.SUCCESS(f'Using user: {superuser.username}'))
            
            # Base URL for API
            base_url = 'http://127.0.0.1:8000/api'
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            # Test reporting mileage
            self.test_report_mileage(base_url, headers, car)
            
            # Test getting next service prediction
            self.test_next_service_prediction(base_url, headers, car)
            
            # Test mileage history
            self.test_mileage_history(base_url, headers, car)
            
            # Test service intervals
            self.test_service_intervals(base_url, headers, car)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
    
    def test_report_mileage(self, base_url, headers, car):
        """Test the mileage reporting endpoint"""
        self.stdout.write(self.style.NOTICE('\n--- Testing Mileage Reporting ---'))
        
        # Report a new mileage update (current mileage + 100)
        url = f'{base_url}/cars/{car.id}/report_mileage/'
        data = {
            'mileage': car.mileage + 100,
            'notes': 'API test mileage update'
        }
        
        try:
            response = requests.post(url, headers=headers, json=data)
            self.display_response(response)
            
            if response.status_code == 201:
                self.stdout.write(self.style.SUCCESS('✓ Mileage reporting test passed'))
            else:
                self.stdout.write(self.style.ERROR('✗ Mileage reporting test failed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {e}'))
    
    def test_next_service_prediction(self, base_url, headers, car):
        """Test the next service prediction endpoint"""
        self.stdout.write(self.style.NOTICE('\n--- Testing Next Service Prediction ---'))
        
        url = f'{base_url}/cars/{car.id}/next_service_prediction/'
        
        try:
            response = requests.get(url, headers=headers)
            self.display_response(response)
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Next service prediction test passed'))
            else:
                self.stdout.write(self.style.ERROR('✗ Next service prediction test failed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {e}'))
    
    def test_mileage_history(self, base_url, headers, car):
        """Test the mileage history endpoint"""
        self.stdout.write(self.style.NOTICE('\n--- Testing Mileage History ---'))
        
        url = f'{base_url}/cars/{car.id}/mileage_history/'
        
        try:
            response = requests.get(url, headers=headers)
            self.display_response(response)
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Mileage history test passed'))
            else:
                self.stdout.write(self.style.ERROR('✗ Mileage history test failed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {e}'))
    
    def test_service_intervals(self, base_url, headers, car):
        """Test the service intervals endpoints"""
        self.stdout.write(self.style.NOTICE('\n--- Testing Service Intervals ---'))
        
        # Test listing all service intervals
        url = f'{base_url}/service-intervals/'
        
        try:
            response = requests.get(url, headers=headers)
            self.display_response(response)
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Service intervals list test passed'))
            else:
                self.stdout.write(self.style.ERROR('✗ Service intervals list test failed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {e}'))
        
        # Test getting make-specific intervals
        url = f'{base_url}/service-intervals/for_vehicle/?make={car.make}&model={car.model}'
        
        try:
            response = requests.get(url, headers=headers)
            self.display_response(response)
            
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Vehicle-specific intervals test passed'))
            else:
                self.stdout.write(self.style.ERROR('✗ Vehicle-specific intervals test failed'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {e}'))
    
    def display_response(self, response):
        """Display the response details"""
        self.stdout.write(f'Status code: {response.status_code}')
        
        if response.status_code in (200, 201):
            try:
                pretty_json = json.dumps(response.json(), indent=2)
                self.stdout.write(f'Response: {pretty_json}')
            except:
                self.stdout.write(f'Response: {response.text[:100]}... (truncated)')
        else:
            self.stdout.write(f'Error: {response.text}') 