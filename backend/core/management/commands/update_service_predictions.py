from django.core.management.base import BaseCommand
from core.models import Car, ServiceHistory, MileageUpdate, ServiceInterval
import logging
from django.db.models import Count, Q, Max
from django.utils import timezone

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Update service predictions for cars'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print verbose output',
        )
        parser.add_argument(
            '--car-id',
            type=int,
            help='Update predictions for a specific car',
        )
        parser.add_argument(
            '--debug',
            action='store_true',
            help='Print extra debug information'
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        verbose = options.get('verbose', False)
        car_id = options.get('car_id')
        debug = options.get('debug', False)
        
        # Configure logging
        logger = logging.getLogger(__name__)
        
        # Query for cars to update
        if car_id:
            cars = Car.objects.filter(id=car_id)
            if not cars.exists():
                self.stdout.write(self.style.ERROR(f"No car found with ID {car_id}"))
                return
        else:
            cars = Car.objects.all()
            
        self.stdout.write(f"Updating service predictions for {cars.count()} cars...")
        
        updated_count = 0
        error_count = 0
        
        for car in cars:
            if verbose:
                self.stdout.write(f"Car {car.id} - {car.make} {car.model} ({car.license_plate})")
                self.stdout.write(f"  Current next service date: {car.next_service_date}")
                self.stdout.write(f"  Current next service mileage: {car.next_service_mileage}")
                self.stdout.write(f"  Current average daily mileage: {car.average_daily_mileage}")
                
                # Show service history for debugging
                service_history = ServiceHistory.objects.filter(car=car).order_by('-service_date', '-service_mileage')
                if service_history.exists():
                    self.stdout.write("  Service History:")
                    for sh in service_history:
                        interval_name = "None"
                        if sh.service_interval:
                            interval_name = f"{sh.service_interval.name}"
                            
                        self.stdout.write(f"    {sh.service_date}: {sh.service_mileage} km (Service Type: {interval_name})")
                        
                    # Get max mileage from service history
                    max_mileage = service_history.aggregate(Max('service_mileage'))['service_mileage__max']
                    self.stdout.write(f"  Max service history mileage: {max_mileage} km")
                    
                    # If we're in debug mode, get service interval info
                    if debug:
                        # Find applicable service intervals for this car
                        service_intervals = ServiceInterval.objects.filter(
                            Q(car_make=car.make, car_model=car.model) | 
                            Q(car_make=car.make, car_model__isnull=True) |
                            Q(car_make__isnull=True, car_model__isnull=True),
                            is_active=True
                        ).order_by('-car_make', '-car_model')
                        
                        if service_intervals.exists():
                            interval = service_intervals.first()
                            self.stdout.write(f"  Using service interval: {interval.name}")
                            self.stdout.write(f"    Interval type: {interval.interval_type}")
                            self.stdout.write(f"    Mileage interval: {interval.mileage_interval} km")
                            self.stdout.write(f"    Time interval: {interval.time_interval_days} days")
                            
                            # Calculate what the next service mileage should be
                            expected_next_mileage = max_mileage + interval.mileage_interval
                            self.stdout.write(f"  Expected next service mileage: {expected_next_mileage} km")
                else:
                    self.stdout.write("  No service history found")
                
                # Show mileage updates for debugging
                mileage_updates = MileageUpdate.objects.filter(car=car).order_by('-reported_date')
                if mileage_updates.exists():
                    self.stdout.write("  Mileage Updates:")
                    for mu in mileage_updates:
                        self.stdout.write(f"    {mu.reported_date.date()}: {mu.mileage} km")
                else:
                    self.stdout.write("  No mileage updates found")
                
            if not dry_run:
                try:
                    # Calculate the average daily mileage for debugging
                    if verbose:
                        old_avg = car.average_daily_mileage
                        new_avg = car._calculate_average_daily_mileage()
                        self.stdout.write(f"  Calculated average daily mileage: {new_avg} km/day (was: {old_avg} km/day)")
                    
                    # In debug mode, manually calculate what next service mileage should be
                    if debug and verbose and service_history.exists():
                        service_intervals = ServiceInterval.objects.filter(
                            Q(car_make=car.make, car_model=car.model) | 
                            Q(car_make=car.make, car_model__isnull=True) |
                            Q(car_make__isnull=True, car_model__isnull=True),
                            is_active=True
                        ).order_by('-car_make', '-car_model')
                        
                        if service_intervals.exists():
                            interval = service_intervals.first()
                            max_mileage = service_history.aggregate(Max('service_mileage'))['service_mileage__max']
                            
                            # Use the highest mileage service history record and add the interval
                            manual_next_mileage = max_mileage + interval.mileage_interval
                            
                            self.stdout.write(f"  Manual calculation of next service mileage:")
                            self.stdout.write(f"    Max service history mileage ({max_mileage}) + Interval ({interval.mileage_interval}) = {manual_next_mileage}")
                    
                    # Update service predictions only if not in dry run mode
                    if not dry_run:
                        updated = car.update_service_predictions()
                        
                        if updated:
                            updated_count += 1
                            if verbose:
                                self.stdout.write(self.style.SUCCESS(f"  Updated to: {car.next_service_date}, {car.next_service_mileage} km"))
                        else:
                            if verbose:
                                self.stdout.write("  No changes to predictions")
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error updating predictions for car {car.id}: {str(e)}")
                    if verbose:
                        self.stdout.write(self.style.ERROR(f"  Error: {str(e)}"))
        
        # Print summary
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"DRY RUN: Would update service predictions for {cars.count()} cars"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Updated service predictions for {updated_count} cars. "
                f"Encountered {error_count} errors."
            )) 