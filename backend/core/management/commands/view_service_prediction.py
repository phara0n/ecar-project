from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.translation import gettext as _
from core.models import Car, MileageUpdate, ServiceInterval, ServiceHistory
from django.db.models import Q

class Command(BaseCommand):
    help = 'View service prediction details for a car'

    def add_arguments(self, parser):
        parser.add_argument(
            '--car-id',
            type=int,
            help='ID of the car to view predictions for',
        )
        parser.add_argument(
            '--license-plate',
            type=str,
            help='License plate of the car to view predictions for',
        )
        parser.add_argument(
            '--recalculate',
            action='store_true',
            help='Force recalculation of service prediction',
        )

    def handle(self, *args, **options):
        car_id = options.get('car_id')
        license_plate = options.get('license_plate')
        recalculate = options.get('recalculate', False)
        
        # Find the car
        car = None
        if car_id:
            try:
                car = Car.objects.get(pk=car_id)
            except Car.DoesNotExist:
                raise CommandError(f"No car found with ID {car_id}")
        elif license_plate:
            try:
                car = Car.objects.get(license_plate=license_plate)
            except Car.DoesNotExist:
                raise CommandError(f"No car found with license plate {license_plate}")
        else:
            # Get a list of cars to choose from
            cars = Car.objects.all().order_by('license_plate')
            if not cars:
                raise CommandError("No cars found in the database")
            
            self.stdout.write("Available cars:")
            for i, car_item in enumerate(cars):
                self.stdout.write(f"{i+1}. {car_item.make} {car_item.model} ({car_item.license_plate})")
            
            while True:
                try:
                    selection = input("Select a car (number): ")
                    index = int(selection) - 1
                    car = cars[index]
                    break
                except (ValueError, IndexError):
                    self.stdout.write(self.style.ERROR("Invalid selection. Please try again."))
        
        # Recalculate prediction if requested
        if recalculate:
            car.update_service_predictions()
            car.refresh_from_db()
            
        # Get recent mileage updates
        mileage_updates = MileageUpdate.objects.filter(car=car).order_by('-reported_date')[:5]
        
        # Get service history
        service_history = ServiceHistory.objects.filter(car=car).order_by('-service_date')[:5]
        
        # Get applicable service intervals
        service_intervals = ServiceInterval.objects.filter(
            Q(car_make=car.make, car_model=car.model) | 
            Q(car_make=car.make, car_model__isnull=True) |
            Q(car_make__isnull=True, car_model__isnull=True),
            is_active=True
        ).order_by('-car_make', '-car_model')
        
        # Display car info
        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS(f"Car: {car.make} {car.model} ({car.license_plate})"))
        self.stdout.write(f"Current mileage: {car.mileage} km")
        self.stdout.write("="*50 + "\n")
        
        # Display mileage updates
        self.stdout.write(self.style.SUCCESS("Recent Mileage Updates:"))
        if mileage_updates:
            for update in mileage_updates:
                self.stdout.write(f"{update.reported_date.strftime('%Y-%m-%d %H:%M')}: {update.mileage} km")
        else:
            self.stdout.write("No mileage updates found")
        self.stdout.write("")
        
        # Display service history
        self.stdout.write(self.style.SUCCESS("Recent Service History:"))
        if service_history:
            for history in service_history:
                service_type = history.service_interval.name if history.service_interval else "Unspecified"
                self.stdout.write(f"{history.service_date.strftime('%Y-%m-%d')}: {service_type} at {history.service_mileage} km")
        else:
            self.stdout.write("No service history found")
        self.stdout.write("")
        
        # Display average daily mileage
        self.stdout.write(f"Average daily mileage: {car.average_daily_mileage:.2f} km/day")
        
        # Display last service info
        if car.last_service_date and car.last_service_mileage:
            days_since_service = (timezone.now().date() - car.last_service_date).days
            mileage_since_service = car.mileage - car.last_service_mileage
            self.stdout.write(f"Last service: {car.last_service_date} at {car.last_service_mileage} km")
            self.stdout.write(f"Days since service: {days_since_service}")
            self.stdout.write(f"Mileage since service: {mileage_since_service} km")
        else:
            self.stdout.write("No service history recorded")
        self.stdout.write("")
        
        # Display applicable service intervals
        self.stdout.write(self.style.SUCCESS("Applicable Service Intervals:"))
        if service_intervals:
            for interval in service_intervals:
                interval_info = f"{interval.name}: "
                if interval.mileage_interval:
                    interval_info += f"{interval.mileage_interval} km"
                if interval.time_interval_days:
                    if interval.mileage_interval:
                        interval_info += " / "
                    interval_info += f"{interval.time_interval_days} days"
                self.stdout.write(interval_info)
        else:
            self.stdout.write("No service intervals defined for this vehicle")
        self.stdout.write("")
        
        # Display next service prediction
        self.stdout.write(self.style.SUCCESS("Next Service Prediction:"))
        
        if car.next_service_date and car.next_service_mileage:
            days_until_service = (car.next_service_date - timezone.now().date()).days
            mileage_until_service = car.next_service_mileage - car.mileage
            
            self.stdout.write(f"Date: {car.next_service_date} ({days_until_service} days from now)")
            self.stdout.write(f"Mileage: {car.next_service_mileage} km ({mileage_until_service} km remaining)")
            
            # Service due soon indicator
            if days_until_service < 14 or mileage_until_service < 500:
                self.stdout.write(self.style.WARNING("Note: *** SERVICE DUE SOON ***"))
        else:
            self.stdout.write("No prediction available. More mileage data or service history needed.") 