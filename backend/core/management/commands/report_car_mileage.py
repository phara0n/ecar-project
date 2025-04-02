from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Car, MileageUpdate


class Command(BaseCommand):
    help = 'Reports new mileage for an existing car'

    def add_arguments(self, parser):
        parser.add_argument('--license_plate', type=str, help='License plate of the car to update')
        parser.add_argument('--mileage', type=int, help='New mileage value to report')

    def handle(self, *args, **options):
        license_plate = options.get('license_plate')
        new_mileage = options.get('mileage')
        
        if not license_plate:
            # If no license plate provided, use the first car in the database
            car = Car.objects.first()
            if not car:
                self.stdout.write(self.style.ERROR('No cars found in the database'))
                return
            license_plate = car.license_plate
        else:
            try:
                car = Car.objects.get(license_plate=license_plate)
            except Car.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'No car found with license plate {license_plate}'))
                return
        
        self.stdout.write(self.style.SUCCESS(f'Using car: {car.make} {car.model} ({car.license_plate})'))
        self.stdout.write(self.style.SUCCESS(f'Current mileage: {car.mileage}'))
        
        if not new_mileage:
            # If no mileage provided, increment current mileage by 500
            new_mileage = car.mileage + 500
        
        if new_mileage <= car.mileage:
            self.stdout.write(self.style.ERROR(f'New mileage ({new_mileage}) must be greater than current mileage ({car.mileage})'))
            return
        
        try:
            # Create a new mileage update
            update = MileageUpdate.objects.create(
                car=car,
                mileage=new_mileage,
                reported_date=timezone.now(),
                notes='Created via management command'
            )
            
            self.stdout.write(self.style.SUCCESS(f'Successfully reported new mileage: {new_mileage}'))
            self.stdout.write(self.style.SUCCESS(f'Car mileage updated to: {car.mileage}'))
            
            # Calculate next service date
            if car.calculate_next_service_date():
                car.save()
                self.stdout.write(self.style.SUCCESS(
                    f'Next service prediction updated: Date={car.next_service_date}, Mileage={car.next_service_mileage}'
                ))
            else:
                self.stdout.write(self.style.WARNING('Could not calculate next service prediction'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reporting mileage: {e}')) 