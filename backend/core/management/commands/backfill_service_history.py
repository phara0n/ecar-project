from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from core.models import Service, ServiceInterval, ServiceHistory
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Backfill ServiceHistory records from completed services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without creating any records',
        )
        parser.add_argument(
            '--service-id',
            type=int,
            help='Process only a specific service by ID',
        )
        parser.add_argument(
            '--car-id',
            type=int,
            help='Process only services for a specific car by ID',
        )
        parser.add_argument(
            '--match-service-types',
            action='store_true',
            help='Try to match service types based on service title and description',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        service_id = options.get('service_id')
        car_id = options.get('car_id')
        match_service_types = options.get('match_service_types', False)
        
        # Get all completed services
        services = Service.objects.filter(status='completed')
        
        # Apply filters if provided
        if service_id:
            services = services.filter(id=service_id)
        if car_id:
            services = services.filter(car_id=car_id)
            
        # Count services that already have service history
        existing_history_count = ServiceHistory.objects.filter(
            service__in=services
        ).count()
        
        self.stdout.write(self.style.SUCCESS(
            f"Found {services.count()} completed services. {existing_history_count} already have service history."
        ))
        
        # Get available service intervals for matching
        service_intervals = None
        if match_service_types:
            service_intervals = ServiceInterval.objects.all()
            self.stdout.write(f"Found {service_intervals.count()} service intervals for matching.")
        
        # Process services
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        for service in services:
            try:
                # Skip if service history already exists
                if ServiceHistory.objects.filter(service=service).exists():
                    skipped_count += 1
                    continue
                
                # Skip if service doesn't have mileage or completed date
                if not service.service_mileage or not service.completed_date:
                    self.stdout.write(self.style.WARNING(
                        f"Service {service.id} ({service.title}) missing mileage or completed date. Skipping."
                    ))
                    skipped_count += 1
                    continue
                
                # Try to match service type if requested
                service_interval = None
                if match_service_types and service_intervals:
                    # First try to use existing service_type if available
                    if service.service_type:
                        service_interval = service.service_type
                    else:
                        # Try to match based on title or description
                        for interval in service_intervals:
                            if (interval.name.lower() in service.title.lower() or 
                                (service.description and interval.name.lower() in service.description.lower())):
                                # Check if make/model matches
                                if (not interval.car_make or 
                                    (interval.car_make.lower() == service.car.make.lower() and 
                                     (not interval.car_model or interval.car_model.lower() == service.car.model.lower()))):
                                    service_interval = interval
                                    # If we found an exact make/model match, stop looking
                                    if interval.car_make and interval.car_model:
                                        break
                
                # Create service history record
                if not dry_run:
                    # Use service.service_type directly as the service_interval
                    service_interval_to_use = service.service_type or service_interval
                    
                    service_history = ServiceHistory.objects.create(
                        car=service.car,
                        service=service,
                        service_interval=service_interval_to_use,
                        service_date=service.completed_date.date(),
                        service_mileage=service.service_mileage
                    )
                    
                    # Update service with service_type and is_routine_maintenance if applicable
                    if service_interval and not service.service_type:
                        service.service_type = service_interval
                        service.is_routine_maintenance = True
                        service.save(update_fields=['service_type', 'is_routine_maintenance'])
                    
                    created_count += 1
                    
                    # Update car's last service info if needed
                    if (not service.car.last_service_date or 
                        service.completed_date.date() > service.car.last_service_date):
                        service.car.last_service_date = service.completed_date.date()
                        service.car.last_service_mileage = service.service_mileage
                        service.car.save(update_fields=['last_service_date', 'last_service_mileage'])
                        
                        # Recalculate service predictions
                        service.car.update_service_predictions()
                else:
                    # Just count in dry run mode
                    created_count += 1
                    
                # Print progress
                if created_count % 10 == 0:
                    self.stdout.write(f"Processed {created_count} services...")
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(
                    f"Error processing service {service.id} ({service.title}): {str(e)}"
                ))
        
        # Print summary
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"DRY RUN: Would have created {created_count} service history records. "
                f"Skipped {skipped_count} services. Encountered {error_count} errors."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Created {created_count} service history records. "
                f"Skipped {skipped_count} services. Encountered {error_count} errors."
            ))
            
            # Update car service predictions
            if created_count > 0:
                self.stdout.write("Updating service predictions for affected cars...")
                updated_cars = set()
                for history in ServiceHistory.objects.filter(service__in=services):
                    if history.car_id not in updated_cars:
                        history.car.update_service_predictions()
                        updated_cars.add(history.car_id)
                self.stdout.write(self.style.SUCCESS(
                    f"Updated service predictions for {len(updated_cars)} cars."
                )) 