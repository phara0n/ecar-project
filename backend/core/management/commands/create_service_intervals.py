from django.core.management.base import BaseCommand
from django.db.models import Q
from core.models import ServiceInterval


class Command(BaseCommand):
    help = 'Creates service intervals for the mileage-based service prediction feature'

    def handle(self, *args, **options):
        # Create service intervals if they don't exist
        intervals_created = self.create_service_intervals()
        
        self.stdout.write(self.style.SUCCESS(
            f'Test data created: {intervals_created} service intervals'
        ))

    def create_service_intervals(self):
        """Create service intervals if they don't exist"""
        intervals_created = 0
        
        # Define common service intervals
        interval_data = [
            {
                'name': 'Oil Change',
                'description': 'Regular oil change service',
                'interval_type': 'mileage',
                'mileage_interval': 5000,
                'is_active': True
            },
            {
                'name': 'Regular Maintenance',
                'description': 'General check-up and maintenance',
                'interval_type': 'both',
                'mileage_interval': 10000,
                'time_interval_days': 180,
                'is_active': True
            },
            {
                'name': 'Major Service',
                'description': 'Complete service including all systems',
                'interval_type': 'both',
                'mileage_interval': 30000,
                'time_interval_days': 365,
                'is_active': True
            },
            {
                'name': 'Toyota Standard Service',
                'description': 'Standard service for Toyota vehicles',
                'interval_type': 'mileage',
                'mileage_interval': 7500,
                'car_make': 'Toyota',
                'is_active': True
            },
            {
                'name': 'Toyota Corolla Service',
                'description': 'Specific service for Toyota Corolla models',
                'interval_type': 'both',
                'mileage_interval': 8000,
                'time_interval_days': 120,
                'car_make': 'Toyota',
                'car_model': 'Corolla',
                'is_active': True
            },
            {
                'name': 'Kia Standard Service',
                'description': 'Standard service for Kia vehicles',
                'interval_type': 'mileage',
                'mileage_interval': 7000,
                'car_make': 'Kia',
                'is_active': True
            },
            {
                'name': 'Kia Picanto Service',
                'description': 'Specific service for Kia Picanto models',
                'interval_type': 'both',
                'mileage_interval': 6000,
                'time_interval_days': 120,
                'car_make': 'Kia',
                'car_model': 'Picanto',
                'is_active': True
            }
        ]
        
        # Create service intervals
        for data in interval_data:
            # Check if the interval already exists
            existing = ServiceInterval.objects.filter(
                Q(name=data['name']) &
                Q(car_make=data.get('car_make', None)) &
                Q(car_model=data.get('car_model', None))
            )
            
            if not existing.exists():
                ServiceInterval.objects.create(**data)
                intervals_created += 1
                self.stdout.write(self.style.SUCCESS(f"Created service interval: {data['name']}"))
        
        return intervals_created 