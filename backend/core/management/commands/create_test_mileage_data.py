import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db.models import Q
from core.models import Car, Customer, MileageUpdate, ServiceInterval
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Creates test data for the mileage-based service prediction feature'

    def handle(self, *args, **options):
        # Make sure we have at least one car
        cars = Car.objects.all()
        if not cars.exists():
            self.stdout.write(self.style.WARNING('No cars found. Creating test customer and car...'))
            
            # Try to get an existing user or create a superuser
            try:
                user = User.objects.filter(is_superuser=True).first()
                if not user:
                    user = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
                    self.stdout.write(self.style.SUCCESS(f'Created superuser: {user.username}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user: {e}'))
                return
            
            # Create test customer
            customer = Customer.objects.create(
                user=user,
                first_name='Test',
                last_name='Customer',
                phone_number='1234567890',
                email='test@example.com',
                address='123 Test Street',
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created customer: {customer.first_name} {customer.last_name}'))
            
            # Create test car
            car = Car.objects.create(
                customer=customer,
                make='Toyota',
                model='Corolla',
                year=2020,
                license_plate='123TU1234',
                color='Blue',
                vin='ABC123456789012345',
                mileage=10000
            )
            self.stdout.write(self.style.SUCCESS(f'Created car: {car.make} {car.model} ({car.license_plate})'))
        else:
            car = cars.first()
            self.stdout.write(self.style.SUCCESS(f'Using existing car: {car.make} {car.model} ({car.license_plate}) with mileage {car.mileage}'))
        
        # Create service intervals if they don't exist
        intervals_created = self.create_service_intervals()
        
        # Create mileage updates for the car
        updates_created = self.create_mileage_updates(car)
        
        # Recalculate predictions
        car.calculate_next_service_date()
        car.save()
        
        self.stdout.write(self.style.SUCCESS(
            f'Test data created: {intervals_created} service intervals, {updates_created} mileage updates'
        ))
        
        if car.next_service_date:
            self.stdout.write(self.style.SUCCESS(
                f'Next service prediction: Date={car.next_service_date}, Mileage={car.next_service_mileage}'
            ))
        else:
            self.stdout.write(self.style.WARNING('No service prediction generated'))

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

    def create_mileage_updates(self, car):
        """Create mileage updates for the given car"""
        # Clear existing mileage updates for the car
        MileageUpdate.objects.filter(car=car).delete()
        
        updates_created = 0
        current_mileage = car.mileage
        
        # For existing cars with high mileage, we'll create historical updates in the past
        # Starting from a value 3000 km less than current mileage
        start_mileage = max(1000, current_mileage - 3000)
        
        # Create 10 mileage updates over the past 60 days, with increasing values
        for i in range(10):
            days_ago = 60 - (i * 6)  # Roughly every 6 days
            update_date = datetime.now() - timedelta(days=days_ago)
            
            # Calculate a mileage value that increases over time
            # Ensure it's always less than the current mileage
            mileage_fraction = i / 10.0  # 0.0 to 0.9
            update_mileage = int(start_mileage + (current_mileage - start_mileage) * mileage_fraction)
            
            # Make sure we're not creating updates with mileage higher than current
            if update_mileage >= current_mileage:
                update_mileage = current_mileage - 10  # Just below current mileage
            
            # Create the mileage update
            update = MileageUpdate.objects.create(
                car=car,
                mileage=update_mileage,
                reported_date=update_date,
                notes=f'Test mileage update {i+1}'
            )
            updates_created += 1
            
            self.stdout.write(self.style.SUCCESS(
                f"Created mileage update: {update.mileage} km on {update.reported_date.strftime('%Y-%m-%d')}"
            ))
        
        # Create a final update at current mileage
        MileageUpdate.objects.create(
            car=car,
            mileage=current_mileage,
            reported_date=datetime.now(),
            notes='Current mileage'
        )
        updates_created += 1
        
        return updates_created 